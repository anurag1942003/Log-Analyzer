##A simple web application for uploading, parsing, and visualizing server log files.

📋 Overview

The Log Analyzer allows users to upload .log files, parses out key information such as timestamps, log levels, and messages, and presents both a textual display and interactive bar charts of log level counts. It includes:
Frontend: HTML/CSS/JavaScript interface featuring a file upload form and Chart.js visualizations.
Backend: Python Flask server to handle uploads, parse logs with regular expressions, store parsed data, and serve JSON responses.
Persistence: JSON-based storage of parsed logs for later retrieval.
Containerization: Dockerized for consistent deployment.

⭐ Features

File Upload: Easily upload .log files via drag-and-drop or file chooser.
Log Parsing: Extracts timestamp, level, and message with regex:
(?P<timestamp>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[,.]\d+) \[(?P<level>\w+)\] (?P<message>.*)
Text Display: Readable listing of parsed log entries.
Metrics & Charts: Interactive bar chart of log level counts using Chart.js.
Persistent Storage: Saves parsed data as timestamped JSON in /data.
Docker Support: Run with a single docker run command.

🛠️ Tech Stack

Frontend: HTML, CSS, JavaScript, Chart.js
Backend: Python 3.9+, Flask
Storage: JSON files
Containerization: Docker

🚀 Prerequisites

Python 3.9+
Docker (optional but recommended)
pip package manager

📥 Installation (Local)

Clone the repository:
git clone https://github.com/your-username/log-analyzer.git
cd log-analyzer

Install Python dependencies:
pip install -r requirements.txt

Build the Docker image:
docker build -t log-analyzer .

Run the container:
docker run -p 5000:5000 log-analyzer

Open in browser:
Visit http://localhost:5000.
