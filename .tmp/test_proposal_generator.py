#!/usr/bin/env python3
"""Quick test script to generate proposal from job data"""

import sys
import os
sys.path.insert(0, '/Users/musacomma/Agentic Workflow')

# Load environment variables from .env
from dotenv import load_dotenv
load_dotenv('/Users/musacomma/Agentic Workflow/.env')

from execution.generate_upwork_proposal import ProposalGenerator, ClipboardManager
from pathlib import Path

# Job data from the Upwork posting
job_data = {
    "job_id": "022017269140345659705",
    "title": "n8n Automation Expert - Hiring Automation System",
    "description": """Summary
We need an n8n automation expert to build a 4-workflow hiring automation system:

SCOPE:
- Flow 1: Indeed Apply webhook → Parse → Google Sheets
- Flow 2: Google Sheets monitor → Trigger Retell AI voice calls (I've already built the Retell agent, just need to pass data to n8n based on certain criteria)
- Flow 3: Retell AI webhook → Update Google Sheets with call results
- Flow 4: Hiring decision → Send notifications + update Indeed (if possible)

REQUIREMENTS:
- Proven n8n experience (show similar projects)
- Webhook setup & API integration expertise (particularly Indeed, Retell, and n8n)
- Google Sheets automation experience
- Clear documentation & handover

TECH STACK:
- n8n (hosted or self-hosted)
- Indeed Apply webhook
- Retell AI API
- Google Sheets API
- Email/SMS notifications

Please include:
1. Similar n8n projects you've built
2. Your approach to this project
3. Estimated hours & timeline
4. Any questions about requirements""",
    "budget": "Not specified",
    "skills": ["n8n", "Automation", "API Integration", "Webhooks", "Google Sheets"],
    "level": "Advanced",
    "client_name": "Not available",
    "category": "Automation"
}

# Generate proposal
generator = ProposalGenerator()
print("Generating proposal...")
proposal = generator.generate_proposal(job_data)

if proposal:
    print("\n" + "="*60)
    print("GENERATED PROPOSAL:")
    print("="*60)
    print(proposal)
    print("="*60)

    # Copy to clipboard
    if ClipboardManager.copy_to_clipboard(proposal):
        print("\n✓ Proposal copied to clipboard!")
    else:
        print("\n⚠ Copy to clipboard failed - proposal displayed above")

    # Save to file
    proposals_dir = Path(".tmp/proposals")
    proposals_dir.mkdir(parents=True, exist_ok=True)
    proposal_file = proposals_dir / f"{job_data['job_id']}_proposal.txt"
    with open(proposal_file, 'w') as f:
        f.write(proposal)
    print(f"✓ Saved to: {proposal_file}")
else:
    print("✗ Failed to generate proposal")
