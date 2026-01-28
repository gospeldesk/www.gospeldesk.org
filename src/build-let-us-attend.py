#!/usr/bin/env python3
"""
Build script to generate let-us-attend/let-us-attend.json

Reads:
  - src/dates.csv: pericope ID -> date mappings
  - _readings/*.md: Gospel pericopes with frontmatter and HTML content

Outputs:
  - let-us-attend/let-us-attend.json with readings and schedule data
"""
import csv
import json
import re
from pathlib import Path


def parse_frontmatter(content):
    """Parse Jekyll frontmatter from markdown file."""
    if not content.startswith('---'):
        return {}, content

    parts = content.split('---', 2)
    if len(parts) < 3:
        return {}, content

    frontmatter = {}
    for line in parts[1].strip().split('\n'):
        if ':' not in line:
            continue
        key, value = line.split(':', 1)
        key = key.strip()
        value = value.strip()

        # Handle quoted strings
        if value.startswith('"') and value.endswith('"'):
            value = value[1:-1]
        # Handle lists like ["a", "b", "c"]
        elif value.startswith('[') and value.endswith(']'):
            items = re.findall(r'"([^"]*)"', value)
            value = items

        frontmatter[key] = value

    body = parts[2].strip()
    return frontmatter, body


def extract_html_content(body):
    """Extract just the HTML paragraph content, excluding ### sections."""
    lines = body.split('\n')
    html_lines = []
    for line in lines:
        # Stop at ### headings (like "### Upcoming Proclamations")
        if line.startswith('###'):
            break
        html_lines.append(line)
    return '\n'.join(html_lines).strip()


def main():
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    # Read dates.csv
    dates_path = script_dir / 'dates.csv'
    schedule = []
    with open(dates_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            schedule.append({
                'date': row['date'],
                'pk': row['id']
            })

    # Sort schedule by date
    schedule.sort(key=lambda x: x['date'])

    # Get all unique pericope IDs from schedule
    pericope_ids = set(row['pk'] for row in schedule)

    # Read readings
    readings_dir = project_root / '_readings'
    readings = {}

    for md_file in readings_dir.glob('*.md'):
        with open(md_file, 'r') as f:
            content = f.read()

        frontmatter, body = parse_frontmatter(content)

        # Skip if no pk or not in our schedule
        pk = frontmatter.get('pk')
        if not pk or pk not in pericope_ids:
            continue

        html_content = extract_html_content(body)

        readings[pk] = {
            'pk': pk,
            'slug': md_file.stem,
            'title': frontmatter.get('title', ''),
            'book': frontmatter.get('book', ''),
            'ref': frontmatter.get('ref', frontmatter.get('excerpt', '')),
            'direct': frontmatter.get('direct', []),
            'content': html_content
        }

    # Build output
    output = {
        'readings': readings,
        'schedule': schedule
    }

    # Write output
    output_path = project_root / 'let-us-attend' / 'let-us-attend.json'
    output_path.parent.mkdir(exist_ok=True)

    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"Generated {output_path}")
    print(f"  - {len(readings)} readings")
    print(f"  - {len(schedule)} scheduled dates")


if __name__ == '__main__':
    main()
