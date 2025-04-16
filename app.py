from flask import Flask, render_template, request, jsonify
import os
import json
import re
from datetime import datetime
from collections import Counter, defaultdict

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
PARSED_LOGS_FILE = 'parsed_logs.json'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Helper: parse log lines
def parse_log_line(line):
    # Example regex for: 2023-01-01 12:34:56,789 [INFO] Message here
    match = re.match(r"(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[,.]\d+) \[(?P<level>\w+)\] (?P<message>.*)", line)
    if match:
        return match.groupdict()
    return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'logfile' not in request.files:
        return 'No file part', 400
    file = request.files['logfile']
    if file.filename == '':
        return 'No selected file', 400
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)
    parsed = []
    with open(filepath, 'r') as f:
        for line in f:
            parsed_line = parse_log_line(line.strip())
            if parsed_line:
                parsed.append(parsed_line)
    # Save to JSON file
    if os.path.exists(PARSED_LOGS_FILE):
        with open(PARSED_LOGS_FILE, 'r') as f:
            all_logs = json.load(f)
    else:
        all_logs = []
    all_logs.extend(parsed)
    with open(PARSED_LOGS_FILE, 'w') as f:
        json.dump(all_logs, f)
    return jsonify({'status': 'success', 'parsed_count': len(parsed)})

@app.route('/logs')
def get_logs():
    # Optionally filter by query params
    level = request.args.get('level')
    with open(PARSED_LOGS_FILE, 'r') as f:
        logs = json.load(f)
    if level:
        logs = [log for log in logs if log['level'] == level]
    return jsonify(logs)

@app.route('/metrics')
def metrics():
    # Example: count logs by level
    with open(PARSED_LOGS_FILE, 'r') as f:
        logs = json.load(f)
    counts = {}
    for log in logs:
        lvl = log['level']
        counts[lvl] = counts.get(lvl, 0) + 1
    return jsonify(dict(counts))

@app.route('/summary')
def summary():
    now = datetime.now()
    with open(PARSED_LOGS_FILE, 'r') as f:
        logs = json.load(f)
    total = len(logs)
    counts = Counter(log['level'] for log in logs)
    # Errors in last 5 min
    errors_last_5min = 0
    for log in logs:
        if log['level'] == 'ERROR':
            try:
                ts = datetime.strptime(log['timestamp'], "%Y-%m-%d %H:%M:%S,%f")
                if (now - ts).total_seconds() <= 300:
                    errors_last_5min += 1
            except Exception:
                pass
    # Most frequent log message
    messages = [log['message'] for log in logs]
    most_common_msg = Counter(messages).most_common(1)
    most_common_msg = most_common_msg[0][0] if most_common_msg else ''
    # Peak log generation hour
    hour_counts = Counter()
    for log in logs:
        try:
            ts = datetime.strptime(log['timestamp'], "%Y-%m-%d %H:%M:%S,%f")
            hour_counts[ts.hour] += 1
        except Exception:
            pass
    busiest_hour = hour_counts.most_common(1)[0][0] if hour_counts else None
    return jsonify({
        'total_logs': total,
        'counts': dict(counts),
        'errors_last_5min': errors_last_5min,
        'most_frequent_message': most_common_msg,
        'busiest_hour': busiest_hour
    })

@app.route('/chartdata')
def chartdata():
    # For line/pie charts: logs by hour, pie distribution, error trend
    with open(PARSED_LOGS_FILE, 'r') as f:
        logs = json.load(f)
    # Logs per hour
    logs_by_hour = defaultdict(int)
    errors_by_hour = defaultdict(int)
    for log in logs:
        try:
            ts = datetime.strptime(log['timestamp'], "%Y-%m-%d %H:%M:%S,%f")
            hour = ts.strftime('%Y-%m-%d %H:00')
            logs_by_hour[hour] += 1
            if log['level'] == 'ERROR':
                errors_by_hour[hour] += 1
        except Exception:
            pass
    # Pie: log type distribution
    pie = Counter(log['level'] for log in logs)
    return jsonify({
        'logs_by_hour': dict(logs_by_hour),
        'errors_by_hour': dict(errors_by_hour),
        'pie': dict(pie)
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
