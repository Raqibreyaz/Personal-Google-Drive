# -e: exit when error occurs
# -u: not defined variable usage will be treated as error
# -o pipefail: if a pipeline fails then whole pipeline will be treated as failed
set -euo pipefail

REPO_DIR="$HOME/Personal-Google-Drive"
BACKEND_DIR="$REPO_DIR/Backend"

# go to the project's directory
cd "$REPO_DIR"

# pull the latest changes of the repository
echo "pulling latest changes from github..."
git pull

if [ "${SHOULD_INSTALL:-false}" = "true" ]; then
    echo "package manifest changed, running pnpm install..."
    cd "$BACKEND_DIR"
    pnpm install --frozen-lockfile
    cd "$REPO_DIR"
else
    echo "no dependency installation required."
fi

# restart the server with the new changes
echo "reloading server with the latest changes..."
pm2 reload storraBackend --update-env

echo "Server deployed successfully."