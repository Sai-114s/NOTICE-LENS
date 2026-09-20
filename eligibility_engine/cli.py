import json
import sys
import argparse
from typing import Dict, Any
from .models import NoticeCriteria, StudentProfile
from .eligibility import evaluate_eligibility

def parse_args():
    parser = argparse.ArgumentParser(description="Deterministic Eligibility Engine")
    parser.add_argument("--criteria", type=str, required=True, help="JSON string or path for criteria")
    parser.add_argument("--student", type=str, required=True, help="JSON string or path for student")
    return parser.parse_args()

def load_json(data: str) -> Dict[str, Any]:
    try:
        if data.endswith(".json"):
            with open(data, 'r') as f:
                return json.load(f)
        return json.loads(data)
    except Exception as e:
        print(json.dumps({"error": f"Failed to parse JSON input: {e}"}))
        sys.exit(1)

def main():
    args = parse_args()
    
    criteria_data = load_json(args.criteria)
    student_data = load_json(args.student)
    
    try:
        criteria = NoticeCriteria(**criteria_data)
        student = StudentProfile(**student_data)
        
        result = evaluate_eligibility(criteria, student)
        
        output = {
            "status": result.status,
            "reasons": result.reasons,
            "missing_information": result.missing_information,
            "action_items": result.action_items
        }
        
        print(json.dumps(output))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
