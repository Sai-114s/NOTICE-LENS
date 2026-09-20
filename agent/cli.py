import argparse
import json
import sys

from .notice_agent import NoticeAgent, NoticeExtractionError, extract_text_from_file


def main():
    parser = argparse.ArgumentParser(description="Run the local NoticeLens notice extractor")
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--text", help="Raw college notice text")
    source.add_argument("--file", help="Local PDF, PNG, JPG, or TXT notice file")
    parser.add_argument("--mode", default=None, choices=["DEMO", "STRANDS"])
    args = parser.parse_args()
    try:
        raw_text = args.text if args.text is not None else extract_text_from_file(args.file)
        agent = NoticeAgent(args.mode)
        notice = agent.extract_structured_data(raw_text)
        print(json.dumps({"notice": notice, "extraction_source": agent.source_label}))
    except Exception as error:
        print(json.dumps({"error": str(error)}), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
