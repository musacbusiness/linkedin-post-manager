#!/usr/bin/env python3
"""
image_pipeline.py — Hybrid Image Pipeline v2

Handles overlay rendering (Pillow), screen detection (OpenCV),
perspective warp and compositing for the LinkedIn Post Manager.

Usage:
  python image_pipeline.py \
    --anchor_config '{"type":"metric_card","top_label":"Time Saved","metric":"20+","unit":"hrs/week","context":"across a 7-person team"}' \
    --base_image /tmp/base.png \
    --output /tmp/final.png
"""

import sys
import json
import argparse
import os
import math

import numpy as np
from PIL import Image, ImageDraw, ImageFont

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("[pipeline] WARNING: opencv-python not installed; screen detection disabled", file=sys.stderr)

# ─── Brand Design Tokens ──────────────────────────────────────────────────────

BRAND = {
    "bg_primary":       "#0F172A",
    "bg_secondary":     "#1E293B",
    "bg_card":          "#1E3A5F",
    "accent":           "#00BCD4",
    "accent_secondary": "#FFB300",
    "success":          "#4CAF50",
    "danger":           "#EF5350",
    "text_primary":     "#FFFFFF",
    "text_secondary":   "#94A3B8",
    "text_accent":      "#00BCD4",
    "border":           "#334155",
}

W, H = 1920, 1080  # Overlay canvas dimensions


def hex_to_rgb(hex_color: str) -> tuple:
    """Convert #RRGGBB to (R, G, B)."""
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


# ─── Font Loading ─────────────────────────────────────────────────────────────

FONTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")

_FONT_CACHE: dict = {}

_FONT_CANDIDATES = {
    "bold":    ["Inter-Bold.ttf", "InterDisplay-Bold.ttf", "Helvetica-Bold.ttf"],
    "regular": ["Inter-Regular.ttf", "Inter.ttf", "Helvetica.ttf"],
    "medium":  ["Inter-Medium.ttf", "Inter-SemiBold.ttf", "Inter-Regular.ttf"],
    "mono":    ["JetBrainsMono-Regular.ttf", "CourierNew.ttf"],
    "serif":   ["DMSerifDisplay-Regular.ttf", "Georgia.ttf"],
}

_SYSTEM_FALLBACKS = [
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]


def load_font(style: str, size: int) -> ImageFont.ImageFont:
    key = f"{style}:{size}"
    if key in _FONT_CACHE:
        return _FONT_CACHE[key]

    for filename in _FONT_CANDIDATES.get(style, _FONT_CANDIDATES["regular"]):
        path = os.path.join(FONTS_DIR, filename)
        if os.path.exists(path):
            try:
                font = ImageFont.truetype(path, size)
                _FONT_CACHE[key] = font
                return font
            except Exception:
                pass

    for path in _SYSTEM_FALLBACKS:
        if os.path.exists(path):
            try:
                font = ImageFont.truetype(path, size)
                _FONT_CACHE[key] = font
                return font
            except Exception:
                pass

    font = ImageFont.load_default()
    _FONT_CACHE[key] = font
    return font


# ─── Drawing Helpers ──────────────────────────────────────────────────────────

def draw_rounded_rect(
    draw: ImageDraw.ImageDraw,
    xy: tuple,
    fill: str,
    radius: int = 12,
    outline: str = None,
    outline_width: int = 2,
) -> None:
    x0, y0, x1, y1 = xy
    r = min(radius, (x1 - x0) // 2, (y1 - y0) // 2)
    fr = hex_to_rgb(fill) if isinstance(fill, str) else fill
    or_ = hex_to_rgb(outline) if isinstance(outline, str) and outline else None

    draw.rectangle([x0 + r, y0, x1 - r, y1], fill=fr)
    draw.rectangle([x0, y0 + r, x1, y1 - r], fill=fr)
    draw.ellipse([x0, y0, x0 + 2 * r, y0 + 2 * r], fill=fr)
    draw.ellipse([x1 - 2 * r, y0, x1, y0 + 2 * r], fill=fr)
    draw.ellipse([x0, y1 - 2 * r, x0 + 2 * r, y1], fill=fr)
    draw.ellipse([x1 - 2 * r, y1 - 2 * r, x1, y1], fill=fr)

    if or_:
        ow = outline_width
        draw.arc([x0, y0, x0 + 2 * r, y0 + 2 * r], 180, 270, fill=or_, width=ow)
        draw.arc([x1 - 2 * r, y0, x1, y0 + 2 * r], 270, 360, fill=or_, width=ow)
        draw.arc([x0, y1 - 2 * r, x0 + 2 * r, y1], 90, 180, fill=or_, width=ow)
        draw.arc([x1 - 2 * r, y1 - 2 * r, x1, y1], 0, 90, fill=or_, width=ow)
        draw.line([x0 + r, y0, x1 - r, y0], fill=or_, width=ow)
        draw.line([x0 + r, y1, x1 - r, y1], fill=or_, width=ow)
        draw.line([x0, y0 + r, x0, y1 - r], fill=or_, width=ow)
        draw.line([x1, y0 + r, x1, y1 - r], fill=or_, width=ow)


def draw_centered_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    y: int,
    font: ImageFont.ImageFont,
    fill: str,
    img_width: int = W,
    x_center: int = None,
) -> None:
    if not text:
        return
    x_center = x_center if x_center is not None else img_width // 2
    fr = hex_to_rgb(fill) if isinstance(fill, str) else fill
    try:
        bbox = font.getbbox(text)
        text_w = bbox[2] - bbox[0]
    except Exception:
        text_w = len(text) * 12
    x = x_center - text_w // 2
    draw.text((x, y), text, font=font, fill=fr)


def wrap_text(text: str, font: ImageFont.ImageFont, max_width: int) -> list:
    """Wrap text to fit within max_width pixels. Returns list of lines."""
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip() if current else word
        try:
            bbox = font.getbbox(test)
            w = bbox[2] - bbox[0]
        except Exception:
            w = len(test) * 12
        if w <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [text]


def render_bars(
    draw: ImageDraw.ImageDraw,
    bars: list,
    base_x: int,
    base_y: int,
    bar_w: int,
    bar_gap: int,
    max_h: int,
    color: str,
) -> None:
    """Render abstract vertical bar chart."""
    cr = hex_to_rgb(color) if isinstance(color, str) else color
    for i, pct in enumerate(bars):
        bh = max(4, int(max_h * min(float(pct), 1.0)))
        x = base_x + i * (bar_w + bar_gap)
        draw.rectangle([x, base_y - bh, x + bar_w, base_y], fill=cr)


# ─── Overlay Type 1: Metric Card ──────────────────────────────────────────────

def render_metric_card(config: dict) -> Image.Image:
    """
    Bold centered metric with label, unit, context, and optional sub-items.
    Keys: top_label, metric, unit, context, sub_items (optional list of {label})
    """
    img = Image.new("RGB", (W, H), hex_to_rgb(BRAND["bg_primary"]))
    draw = ImageDraw.Draw(img)

    top_label = str(config.get("top_label", "Key Metric")).upper()
    metric    = str(config.get("metric", "—"))
    unit      = str(config.get("unit", ""))
    context   = str(config.get("context", ""))

    font_label   = load_font("regular", 36)
    font_metric  = load_font("bold", 240)
    font_unit    = load_font("bold", 52)
    font_context = load_font("regular", 32)

    draw_centered_text(draw, top_label, y=155, font=font_label, fill=BRAND["text_secondary"])
    draw_centered_text(draw, metric,    y=215, font=font_metric, fill=BRAND["text_primary"])
    draw_centered_text(draw, unit,      y=525, font=font_unit,   fill=BRAND["accent"])

    accent_rgb = hex_to_rgb(BRAND["accent"])
    draw.line([(W // 2 - 120, 615), (W // 2 + 120, 615)], fill=accent_rgb, width=3)

    if context:
        draw_centered_text(draw, context, y=645, font=font_context, fill=BRAND["text_secondary"])

    sub_items = config.get("sub_items", [])
    if sub_items:
        box_w, box_h = 260, 120
        gap = 40
        items = sub_items[:4]
        total_w = len(items) * box_w + (len(items) - 1) * gap
        start_x = (W - total_w) // 2
        font_item = load_font("medium", 24)
        for i, item in enumerate(items):
            bx = start_x + i * (box_w + gap)
            by = 760
            draw_rounded_rect(draw, (bx, by, bx + box_w, by + box_h),
                              fill=BRAND["bg_secondary"], radius=10,
                              outline=BRAND["border"], outline_width=2)
            label = str(item.get("label", ""))
            draw_centered_text(draw, label, y=by + 44,
                               font=font_item, fill=BRAND["text_primary"],
                               x_center=bx + box_w // 2)

    return img


# ─── Overlay Type 2: Comparison ───────────────────────────────────────────────

def render_comparison(config: dict) -> Image.Image:
    """
    Side-by-side comparison panels.
    Keys: left {label, metric, metric_label, tone, bars}, right {...}, vs_label
    """
    img = Image.new("RGB", (W, H), hex_to_rgb(BRAND["bg_primary"]))
    draw = ImageDraw.Draw(img)

    left  = config.get("left", {})
    right = config.get("right", {})

    mid  = W // 2
    top  = 60
    bot  = 980
    l_cx = (50 + mid - 40) // 2
    r_cx = (mid + 40 + W - 50) // 2

    l_tone = BRAND["danger"]  if left.get("tone")  == "negative" else BRAND["success"]
    r_tone = BRAND["success"] if right.get("tone") == "positive" else BRAND["danger"]

    draw_rounded_rect(draw, (50, top, mid - 40, bot),
                      fill=BRAND["bg_secondary"], radius=16,
                      outline=BRAND["border"], outline_width=2)
    draw_rounded_rect(draw, (mid + 40, top, W - 50, bot),
                      fill=BRAND["bg_card"], radius=16,
                      outline=BRAND["accent"], outline_width=2)

    font_label  = load_font("bold",    40)
    font_metric = load_font("bold",   110)
    font_sub    = load_font("regular", 30)

    for label, metric, metric_label, tone, bars, cx in [
        (left.get("label",  "Before"), left.get("metric",  "—"),
         left.get("metric_label",  ""), l_tone,
         left.get("bars",  [0.4, 0.5, 0.3, 0.6, 0.35]), l_cx),
        (right.get("label", "After"),  right.get("metric", "—"),
         right.get("metric_label", ""), r_tone,
         right.get("bars", [0.85, 0.9, 0.95, 0.8, 0.88]), r_cx),
    ]:
        draw_centered_text(draw, str(label).upper(), y=115,
                           font=font_label, fill=tone, x_center=cx)
        draw_centered_text(draw, str(metric), y=200,
                           font=font_metric, fill=tone, x_center=cx)
        draw_centered_text(draw, str(metric_label), y=365,
                           font=font_sub, fill=BRAND["text_secondary"], x_center=cx)
        render_bars(draw, bars, base_x=cx - 200, base_y=760,
                    bar_w=60, bar_gap=20, max_h=300, color=tone)

    # VS badge
    br = 58
    bx, by = W // 2, H // 2
    accent_rgb = hex_to_rgb(BRAND["accent"])
    bg_rgb     = hex_to_rgb(BRAND["bg_primary"])
    draw.ellipse([bx - br, by - br, bx + br, by + br], fill=bg_rgb)
    draw.ellipse([bx - br, by - br, bx + br, by + br], outline=accent_rgb, width=3)
    vs_font = load_font("bold", 36)
    draw_centered_text(draw, "VS", y=by - 22, font=vs_font,
                       fill=BRAND["text_primary"], x_center=bx)

    return img


# ─── Overlay Type 3: Flow Diagram ─────────────────────────────────────────────

def render_flow_diagram(config: dict) -> Image.Image:
    """
    Horizontal step flow with converging lines to a result node.
    Keys: steps (list of {label, sublabel}), result {label, metric, sublabel}
    """
    img = Image.new("RGB", (W, H), hex_to_rgb(BRAND["bg_primary"]))
    draw = ImageDraw.Draw(img)

    steps  = config.get("steps", [])[:5]
    result = config.get("result", {})
    n = len(steps)

    if n == 0:
        return img

    step_w, step_h = 300, 180
    gap = 60
    total_w = n * step_w + (n - 1) * gap
    start_x = (W - total_w) // 2
    top_y   = 180

    font_step_label  = load_font("bold",    28)
    font_step_sub    = load_font("regular", 22)
    font_res_label   = load_font("regular", 24)
    font_res_metric  = load_font("bold",    80)
    font_res_sub     = load_font("medium",  26)

    accent_rgb = hex_to_rgb(BRAND["accent"])
    step_centers = []

    for i, step in enumerate(steps):
        x = start_x + i * (step_w + gap)
        draw_rounded_rect(draw, (x, top_y, x + step_w, top_y + step_h),
                          fill=BRAND["bg_secondary"], radius=12,
                          outline=BRAND["border"], outline_width=2)
        cx = x + step_w // 2
        step_centers.append(cx)

        draw_centered_text(draw, str(step.get("label", f"Step {i+1}")),
                           y=top_y + 52, font=font_step_label,
                           fill=BRAND["text_primary"], x_center=cx)
        draw_centered_text(draw, str(step.get("sublabel", "")),
                           y=top_y + 100, font=font_step_sub,
                           fill=BRAND["text_secondary"], x_center=cx)

        if i < n - 1:
            ax0 = x + step_w + 5
            ax1 = ax0 + gap - 10
            ay  = top_y + step_h // 2
            draw.line([(ax0, ay), (ax1, ay)], fill=accent_rgb, width=4)
            draw.polygon([(ax1, ay - 8), (ax1, ay + 8), (ax1 + 14, ay)], fill=accent_rgb)

    # Converging lines to result node
    result_y = top_y + step_h + 120
    center_x = W // 2
    for cx in step_centers:
        draw.line([(cx, top_y + step_h), (center_x, result_y)], fill=accent_rgb, width=2)

    rw, rh = 440, 260
    rx = center_x - rw // 2
    ry = result_y + 10
    draw_rounded_rect(draw, (rx, ry, rx + rw, ry + rh),
                      fill=BRAND["bg_card"], radius=16,
                      outline=BRAND["accent"], outline_width=3)

    draw_centered_text(draw, str(result.get("label", "TOTAL")).upper(),
                       y=ry + 28, font=font_res_label,
                       fill=BRAND["text_secondary"], x_center=center_x)
    draw_centered_text(draw, str(result.get("metric", "—")),
                       y=ry + 68, font=font_res_metric,
                       fill=BRAND["text_primary"], x_center=center_x)
    draw_centered_text(draw, str(result.get("sublabel", "")),
                       y=ry + 195, font=font_res_sub,
                       fill=BRAND["accent"], x_center=center_x)

    return img


# ─── Overlay Type 4: Dashboard ────────────────────────────────────────────────

def render_dashboard(config: dict) -> Image.Image:
    """
    Multi-widget dashboard: top metric cards, bar chart, bottom stats.
    Keys: top_metrics [{label,value,change,tone}], chart {values,labels},
          bottom_stats [{label,value}]
    """
    img = Image.new("RGB", (W, H), hex_to_rgb(BRAND["bg_primary"]))
    draw = ImageDraw.Draw(img)

    top_metrics  = config.get("top_metrics", [])[:3]
    chart        = config.get("chart", {})
    bottom_stats = config.get("bottom_stats", [])[:4]

    font_mval    = load_font("bold",    68)
    font_mlabel  = load_font("regular", 26)
    font_mchange = load_font("medium",  22)
    font_clabel  = load_font("regular", 20)
    font_sval    = load_font("bold",    44)
    font_slabel  = load_font("regular", 22)

    # Top metric cards
    if top_metrics:
        n = len(top_metrics)
        cw = (W - 80 - (n - 1) * 24) // n
        ch = 200
        for i, m in enumerate(top_metrics):
            cx_ = 40 + i * (cw + 24)
            draw_rounded_rect(draw, (cx_, 40, cx_ + cw, 40 + ch),
                              fill=BRAND["bg_secondary"], radius=12,
                              outline=BRAND["border"], outline_width=2)
            tone = BRAND["success"] if m.get("tone") == "positive" else BRAND["danger"]
            ccx  = cx_ + cw // 2
            draw_centered_text(draw, str(m.get("label", "")), y=60,
                               font=font_mlabel, fill=BRAND["text_secondary"], x_center=ccx)
            draw_centered_text(draw, str(m.get("value", "—")), y=98,
                               font=font_mval, fill=tone, x_center=ccx)
            draw_centered_text(draw, str(m.get("change", "")), y=183,
                               font=font_mchange, fill=BRAND["text_secondary"], x_center=ccx)

    # Chart area
    ct, cb, cl, cr_ = 270, 740, 40, W - 40
    draw_rounded_rect(draw, (cl, ct, cr_, cb),
                      fill=BRAND["bg_secondary"], radius=12,
                      outline=BRAND["border"], outline_width=2)

    values = chart.get("values", [4, 8, 14, 20])
    labels = chart.get("labels", [f"W{i+1}" for i in range(len(values))])
    chart_color = hex_to_rgb(BRAND["accent"])

    if values:
        max_v = max(values) or 1
        il, ir_, it, ib_ = cl + 60, cr_ - 40, ct + 30, cb - 50
        ih = ib_ - it
        nb = len(values)
        bw = max(20, int((ir_ - il) / (nb * 1.6)))
        sp = max(4, (ir_ - il - nb * bw) // (nb + 1))
        for i, val in enumerate(values):
            bh  = int((val / max_v) * ih * 0.85)
            bx_ = il + sp + i * (bw + sp)
            by_ = ib_ - bh
            draw.rectangle([bx_, by_, bx_ + bw, ib_], fill=chart_color)
            if i < len(labels):
                draw_centered_text(draw, str(labels[i]), y=ib_ + 6,
                                   font=font_clabel, fill=BRAND["text_secondary"],
                                   x_center=bx_ + bw // 2)

    # Bottom stat cards
    if bottom_stats:
        n = len(bottom_stats)
        sw = (W - 80 - (n - 1) * 24) // n
        sh = 150
        st = cb + 28
        for i, s in enumerate(bottom_stats):
            sx_ = 40 + i * (sw + 24)
            draw_rounded_rect(draw, (sx_, st, sx_ + sw, st + sh),
                              fill=BRAND["bg_secondary"], radius=12,
                              outline=BRAND["border"], outline_width=2)
            scx = sx_ + sw // 2
            draw_centered_text(draw, str(s.get("value", "—")), y=st + 24,
                               font=font_sval, fill=BRAND["text_primary"], x_center=scx)
            draw_centered_text(draw, str(s.get("label", "")), y=st + 94,
                               font=font_slabel, fill=BRAND["text_secondary"], x_center=scx)

    return img


# ─── Overlay Type 5: Pull Quote Card ──────────────────────────────────────────

def render_pull_quote_card(config: dict) -> Image.Image:
    """
    Branded pull quote for strategic/philosophical posts.
    Keys: quote, author
    """
    img = Image.new("RGB", (W, H), hex_to_rgb(BRAND["bg_primary"]))
    draw = ImageDraw.Draw(img)

    quote  = str(config.get("quote", "Strategy beats tools."))
    author = str(config.get("author", ""))

    font_quote  = load_font("serif",   64)
    font_author = load_font("regular", 28)
    accent_rgb  = hex_to_rgb(BRAND["accent"])

    lines    = wrap_text(quote, font_quote, W - 320)
    line_h   = 82
    total_h  = len(lines) * line_h
    start_y  = (H - total_h) // 2 - 50

    # Top accent line
    draw.line([(W // 2 - 80, start_y - 44), (W // 2 + 80, start_y - 44)],
              fill=accent_rgb, width=4)

    for i, line in enumerate(lines):
        draw_centered_text(draw, line, y=start_y + i * line_h,
                           font=font_quote, fill=BRAND["text_primary"])

    end_y = start_y + len(lines) * line_h + 20

    # Bottom accent line
    draw.line([(W // 2 - 80, end_y), (W // 2 + 80, end_y)],
              fill=accent_rgb, width=4)

    if author:
        draw_centered_text(draw, f"— {author}", y=end_y + 30,
                           font=font_author, fill=BRAND["text_secondary"])

    return img


# ─── Overlay Dispatch ─────────────────────────────────────────────────────────

OVERLAY_RENDERERS = {
    "metric_card":     render_metric_card,
    "comparison":      render_comparison,
    "flow_diagram":    render_flow_diagram,
    "dashboard":       render_dashboard,
    "pull_quote_card": render_pull_quote_card,
}


# ─── Screen Detection (OpenCV) ────────────────────────────────────────────────

def order_points(pts: np.ndarray) -> np.ndarray:
    """Order 4 points as: TL, TR, BR, BL."""
    rect = np.zeros((4, 2), dtype="float32")
    s    = pts.sum(axis=1)
    d    = np.diff(pts, axis=1)
    rect[0] = pts[np.argmin(s)]   # top-left
    rect[2] = pts[np.argmax(s)]   # bottom-right
    rect[1] = pts[np.argmin(d)]   # top-right
    rect[3] = pts[np.argmax(d)]   # bottom-left
    return rect


def detect_screen_by_edges(gray: np.ndarray, img_area: int):
    """Edge-based fallback screen detection using Canny + contour approximation."""
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges   = cv2.Canny(blurred, 50, 150)
    kernel  = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    edges   = cv2.dilate(edges, kernel, iterations=2)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    min_area = img_area * 0.08

    for contour in sorted(contours, key=cv2.contourArea, reverse=True):
        area = cv2.contourArea(contour)
        if area < min_area:
            continue
        peri  = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.05 * peri, True)
        if len(approx) == 4:
            return order_points(approx.reshape(4, 2))

    return None


def detect_screen(image_path: str):
    """
    Detect the largest uniform-dark rectangular region (screen) in the image.
    Returns np.ndarray of 4 corners [TL, TR, BR, BL] or None.
    """
    if not CV2_AVAILABLE:
        return None

    img = cv2.imread(image_path)
    if img is None:
        return None

    hsv      = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    gray     = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img_area = img.shape[0] * img.shape[1]
    min_area = img_area * 0.08
    max_area = img_area * 0.70

    # Primary: color-based — find large uniform-dark region
    lower_dark = np.array([0,   0,  15])
    upper_dark = np.array([180, 80, 80])
    mask = cv2.inRange(hsv, lower_dark, upper_dark)

    k15 = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
    k5  = cv2.getStructuringElement(cv2.MORPH_RECT, (5,  5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k15)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  k5)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    candidates  = []

    for c in contours:
        area = cv2.contourArea(c)
        if area < min_area or area > max_area:
            continue
        peri  = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            candidates.append((area, approx))
        elif 4 < len(approx) <= 8:
            approx2 = cv2.approxPolyDP(c, 0.05 * peri, True)
            if len(approx2) == 4:
                candidates.append((area, approx2))

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        return order_points(candidates[0][1].reshape(4, 2))

    # Fallback: edge-based
    return detect_screen_by_edges(gray, img_area)


def get_fallback_screen_region(image_path: str) -> np.ndarray:
    """Return centered rectangular region when detection fails."""
    if CV2_AVAILABLE:
        img = cv2.imread(image_path)
        if img is not None:
            h_, w_ = img.shape[:2]
            mx, my = int(w_ * 0.18), int(h_ * 0.15)
            return np.array([
                [mx,      my],
                [w_ - mx, my],
                [w_ - mx, h_ - my],
                [mx,      h_ - my],
            ], dtype="float32")

    # Ultimate fallback for 1024x1024
    return np.array([[184, 154], [840, 154], [840, 870], [184, 870]], dtype="float32")


# ─── Perspective Warp & Composite ─────────────────────────────────────────────

def composite_overlay_to_screen(
    base_image_path: str,
    overlay_pil: Image.Image,
    screen_corners: np.ndarray,
) -> Image.Image:
    """
    Warp flat overlay to screen perspective, composite with feathered blending.
    Returns PIL Image.
    """
    if not CV2_AVAILABLE:
        raise RuntimeError("opencv-python is required for compositing")

    base = cv2.imread(base_image_path)
    if base is None:
        raise ValueError(f"Cannot read base image: {base_image_path}")

    overlay_np  = np.array(overlay_pil.convert("RGB"))
    overlay_bgr = cv2.cvtColor(overlay_np, cv2.COLOR_RGB2BGR)
    ho, wo      = overlay_bgr.shape[:2]

    src = np.array(
        [[0, 0], [wo - 1, 0], [wo - 1, ho - 1], [0, ho - 1]],
        dtype="float32",
    )
    dst = screen_corners.astype("float32")

    M      = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(overlay_bgr, M, (base.shape[1], base.shape[0]))

    # Mask for the screen region
    mask = np.zeros((base.shape[0], base.shape[1]), dtype="uint8")
    cv2.fillConvexPoly(mask, dst.astype("int32"), 255)

    # Slight brightness reduction — screens in lit rooms are never 100% raw
    warped = (warped.astype(np.float32) * 0.87).clip(0, 255).astype(np.uint8)

    # Feathered blend
    mask_blur = cv2.GaussianBlur(mask, (5, 5), 0)
    m3 = cv2.merge([mask_blur, mask_blur, mask_blur]).astype(np.float32) / 255.0

    result = (
        base.astype(np.float32) * (1.0 - m3) +
        warped.astype(np.float32) * m3
    ).clip(0, 255).astype(np.uint8)

    return Image.fromarray(cv2.cvtColor(result, cv2.COLOR_BGR2RGB))


# ─── Main Pipeline ────────────────────────────────────────────────────────────

def run_pipeline(anchor_config: dict, base_image_path: str, output_path: str) -> dict:
    """Full pipeline: render overlay → detect screen → warp → composite → save."""

    overlay_type = anchor_config.get("type", "metric_card")
    renderer     = OVERLAY_RENDERERS.get(overlay_type, render_metric_card)
    overlay_img  = renderer(anchor_config)
    print(f"[pipeline] Rendered overlay type: {overlay_type}", file=sys.stderr)

    screen_corners = detect_screen(base_image_path)
    used_fallback  = False

    if screen_corners is None:
        print("[pipeline] Screen detection failed — using centered fallback region", file=sys.stderr)
        screen_corners = get_fallback_screen_region(base_image_path)
        used_fallback  = True
    else:
        print(f"[pipeline] Screen detected: {screen_corners.tolist()}", file=sys.stderr)

    if CV2_AVAILABLE:
        final = composite_overlay_to_screen(base_image_path, overlay_img, screen_corners)
    else:
        # No OpenCV: just save the flat overlay resized to base image dimensions
        base_pil = Image.open(base_image_path).convert("RGB")
        final    = overlay_img.resize(base_pil.size, Image.LANCZOS)
        print("[pipeline] WARNING: Saved flat overlay (no OpenCV for compositing)", file=sys.stderr)

    final.save(output_path, "PNG")
    print(f"[pipeline] Output saved: {output_path}", file=sys.stderr)

    return {
        "output_path":     output_path,
        "overlay_type":    overlay_type,
        "screen_detected": not used_fallback,
    }


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LinkedIn Post Manager — Image Pipeline v2")
    parser.add_argument("--anchor_config", required=True, help="JSON anchor config string")
    parser.add_argument("--base_image",    required=True, help="Path to base image")
    parser.add_argument("--output",        required=True, help="Output path for composited image")
    args = parser.parse_args()

    try:
        config = json.loads(args.anchor_config)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid anchor_config JSON: {e}"}))
        sys.exit(1)

    try:
        result = run_pipeline(config, args.base_image, args.output)
        print(json.dumps(result))
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
