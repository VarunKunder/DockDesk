DockDesk - Your Personal Homelab Dashboard
<!-- Replace with a URL to your screenshot -->

DockDesk is a modern, responsive, and feature-rich dashboard for monitoring and managing your personal homelab server. Built with a React frontend and a Node.js backend, it provides a clean interface to control your Docker containers, manage files, monitor system resources, and even handle your music library, all from a single place.

✨ Features
DockDesk is packed with powerful widgets to give you full control over your server:

📊 System Stats:

View real-time, accurate CPU usage, RAM usage, and disk space utilization.

Monitor your server's CPU temperature to ensure optimal performance.

Data is fetched live from the server's OS for 100% accuracy.

🐳 Docker Management:

See a live list of all your Docker containers and their current status (running, exited, etc.).

Start, stop, and restart any container directly from the dashboard.

The container list is scrollable to maintain a clean layout, no matter how many containers you have.

🔧 Services Grid:

Add and monitor the status of all your self-hosted services (e.g., Nextcloud, Jellyfin).

The dashboard automatically checks if each service is online or offline.

📂 File Browser:

Securely browse a specified directory on your homelab server (e.g., a mounted hard drive).

Navigate through folders and download files directly from the dashboard.

The backend is "jailed" to a specific root directory for security, preventing access to sensitive system files.

🎵 Music Player & Spotify Downloader:

A fully functional music player that streams and plays songs directly from your server's music folder.

Includes playback controls (play/pause, skip), a seekable progress bar, and a volume/mute control.

Search your downloaded music library in real-time.

Features a Spotify Downloader: paste any Spotify playlist URL to download the songs directly to your music folder using spotdl, with live progress logs streamed to the dashboard.

🛠️ Tech Stack
This project uses a modern and robust set of technologies:

Frontend (React + Vite)
Framework: React with TypeScript

Build Tool: Vite

UI Components: shadcn/ui

Styling: Tailwind CSS

Icons: Lucide React

Real-time Communication: Socket.IO Client

Backend (Node.js + Express)
Framework: Express.js with TypeScript

System Stats: systeminformation library for accurate, cross-platform hardware data.

Docker Control: dockerode to securely interact with the Docker engine.

Command Execution: Secure child_process.spawn for running spotdl.

Real-time Communication: Socket.IO

Deployment
Containerization: Docker & Docker Compose

🚀 Setup & Installation (Production on Homelab Server)
Follow these steps to get DockDesk running on your Ubuntu/Debian-based homelab server.

1. Prerequisites
Ensure your server has the following installed:

Git

Docker & Docker Compose (sudo apt-get install -y docker.io docker-compose-plugin)

Python & Pip (sudo apt-get install -y python3-pip)

spotdl (pip install spotdl)

2. Get the Code
Clone the repository onto your server:

git clone [https://github.com/VarunKunder/DockDesk.git](https://github.com/VarunKunder/DockDesk.git)
cd DockDesk

3. Configure the Application
The entire application is configured using the docker-compose.yml file. Open it with a text editor (nano docker-compose.yml) and verify the volume paths on the left side of the colon (:) match your server's setup.

/mnt/hdd: The path to the hard drive you want to browse and monitor.

/mnt/hdd/docker/navidrome/music: The path to your music library.

4. Build and Run
Run the following command from the root of the project directory:

sudo docker compose up --build -d

--build: This will build the frontend and backend Docker images.

-d: This runs the application in the background.

Your dashboard is now live! You can access it by going to http://<your-server-ip>:8080.

💻 Development
To run the project on your local machine (e.g., a Windows laptop) for development, follow these steps.

1. Backend Setup
Navigate to the /backend directory.

Install dependencies: yarn install

Create a .env file and add your server's Tailscale IP:

DOCKER_HOST=100.x.y.z

In package.json, update the dev script with the correct paths for your server:

"dev": "cross-env FILE_BROWSER_ROOT=/mnt/hdd SPOTDL_OUTPUT_PATH=/mnt/hdd/docker/navidrome/music STATS_DISK_PATH=/mnt/hdd ts-node-dev -r dotenv/config --respawn --transpile-only src/index.ts"

Run the backend: yarn dev

2. Frontend Setup
Navigate to the /frontend directory.

Install dependencies: yarn install

Run the frontend: yarn dev

The frontend will be available at http://localhost:8080 (or as specified by Vite) and will connect to the backend running on localhost:3001.
