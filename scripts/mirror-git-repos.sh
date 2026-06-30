#!/bin/bash
# Sync remote branches between GitHub and the Gitea local-mirror host on VM

echo "=== Git Mirror Sync: GitHub ⇆ Gitea ==="
echo "Step 1: Fetching latest code from GitHub..."
git fetch origin

echo "Step 2: Mirroring main branch and tags to Gitea VM..."
git push gitea main --tags

echo "Step 3: Mirroring all remote branches to Gitea..."
git push gitea --prune "+refs/remotes/origin/*:refs/heads/*"

echo "✓ Mirror synchronization complete!"
