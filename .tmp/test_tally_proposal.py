#!/usr/bin/env python3
"""Generate proposal for Tally → Make → Airtable integration job"""

import sys
import os
sys.path.insert(0, '/Users/musacomma/Agentic Workflow')

# Load environment variables from .env
from dotenv import load_dotenv
load_dotenv('/Users/musacomma/Agentic Workflow/.env')

from execution.generate_upwork_proposal import ProposalGenerator, ClipboardManager
from pathlib import Path

# Job data for Tally → Make → Airtable integration
job_data = {
    "job_id": "tally_make_airtable_integration",
    "title": "Tally → Make → Airtable Integration Specialist",
    "description": """I am looking for an experienced automation specialist to complete a simple, clean integration between three tools: Tally (form) Make (webhook + mapping) Airtable (single table)

The goal is straightforward: When a user submits a Tally form, the data should be accurately and reliably written into Airtable, with correct field mapping and no missing values.

This is not a complex automation. No conditional logic, no branching, no email automation. Just a clean, correct pipeline.

Deliverables:
- Fully working Tally → Make → Airtable integration
- Confirmation that all fields map correctly
- Few successful test submissions recorded in Airtable
- Short written summary of the setup and assumptions

Reply with a fixed price for the job and timeframe of completion.

NOTE: I can complete this in 1 day for $300 all-in.""",
    "budget": "$300 fixed price",
    "skills": ["Make.com", "Airtable", "Tally", "Webhooks", "Data Mapping"],
    "level": "Intermediate",
    "client_name": "Not available",
    "category": "Automation"
}

# Generate proposal
generator = ProposalGenerator()
print("Generating proposal for Tally → Make → Airtable integration...\n")
proposal = generator.generate_proposal(job_data)

if proposal:
    print("="*70)
    print("GENERATED PROPOSAL:")
    print("="*70)
    print(proposal)
    print("="*70)

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
