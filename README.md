# Location Insights for Small and Medium-sized Businesses

This project consists of a React frontend and a FastAPI backend for a Tampere city explorer application.

**Live demo available at:** https://location-insights.onrender.com/

## Project Structure

- `frontend/` - Frontend React application
- `backend/` - FastAPI backend providing data for the application

For detailed documentation about the project structure, features, workflows, and API endpoints, please refer to [project_structure.md](project_structure.md).

## Tech Stack

### Frontend

- React with TypeScript
- Vite as build tool
- Tailwind CSS for styling
- React Query for state management
- React Router for routing
- Custom components built with Radix UI primitives

### Backend

- Python 3.12
- FastAPI framework
- uv for Python package management
- Custom database implementation

## Frontend

The frontend is a React application that displays the Tampere Explorer Hub interface.

## Backend

The backend is a FastAPI application providing all the data for the frontend:

- Hotspots
- Events
- Map items
- Traffic data

## Supported Operating Systems

- **Ubuntu Linux / WSL (Windows Subsystem for Linux)** – Recommended and fully supported
- **macOS** – Should work, but not officially tested
- **Windows (native)** – Not recommended for backend development; use WSL for best compatibility

## Setup and Running

### Prerequisites

- **Node.js** and **npm** for the frontend
- **Python 3.12** for the backend (recommended to use [pyenv](https://github.com/pyenv/pyenv))
- **uv** for Python package management

---

### Python 3.12 Setup (if needed), otherwise setup last three lines

If you do not have Python 3.12, install it using [pyenv](https://github.com/pyenv/pyenv):

```bash
# Install pyenv if not already installed
curl https://pyenv.run | bash

# Add pyenv to your shell (add these lines to ~/.bashrc if not present)
export PATH="$HOME/.pyenv/bin:$PATH"
eval "$(pyenv init --path)"
eval "$(pyenv virtualenv-init -)"

# Restart your terminal or run:
source ~/.bashrc

# Install Python 3.12 and set it locally for the backend
pyenv install 3.12.0
cd backend
pyenv local 3.12.0
cd ..
```

---

### One-Time Project Setup

Run the provided setup script from the project root (requires bash/WSL/Linux):
Also please take a look for understading

```bash
chmod +x helper/scripts/setup_project.sh
./helper/scripts/firsttime_setup_project.sh
```

This script will:
- Install frontend dependencies
- Set up the backend Python virtual environment
- Install backend dependencies using `uv` and `pyproject.toml`
- Build the backend

---

### Starting the Development Servers

After setup, in separate terminals:

**Backend:**
```bash
cd backend
source .venv/bin/activate
python main.py
```
_or, just run an npm script available in package.json:_

```bash
npm run backend:dev
```
_or, you can manually activate the virtual env using "source backend/.venv/bin/activate" inside the root folder and then run the below script_

```bash
npm run backend:dev2
```

The backend will be running at http://localhost:8000. API documentation is available at http://localhost:8000/docs.

**Frontend:**
```bash
npm run frontend:dev
```

The frontend will be running at http://localhost:8080.

---

### Notes

- If you encounter issues with Python versions, ensure you have Python 3.12 active in the backend directory (`pyenv local 3.12.0`).
- For Windows users, WSL (Ubuntu) is recommended for best compatibility.

---
