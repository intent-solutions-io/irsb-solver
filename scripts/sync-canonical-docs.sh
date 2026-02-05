#!/bin/bash
# Sync canonical docs (000-*) from irsb-solver to other IRSB repos
# Usage: ./scripts/sync-canonical-docs.sh [target-repo-path]
#
# This script copies 000-* files from irsb-solver (source of truth) to target repos
# and verifies checksums match.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DOCS="${SCRIPT_DIR}/../000-docs"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Get checksums for all 000-* files
get_checksums() {
    local dir="$1"
    if [ -d "$dir" ]; then
        for file in "$dir"/000-*.md; do
            if [ -f "$file" ]; then
                shasum -a 256 "$file" | cut -d' ' -f1
                echo "  $(basename "$file")"
            fi
        done
    fi
}

# Sync to a target repo
sync_to_repo() {
    local target_repo="$1"
    local target_docs="$target_repo/000-docs"

    if [ ! -d "$target_repo" ]; then
        log_error "Target repo not found: $target_repo"
        return 1
    fi

    mkdir -p "$target_docs"

    log_info "Syncing canonical docs to: $target_repo"

    for file in "$SOURCE_DOCS"/000-*.md; do
        if [ -f "$file" ]; then
            local filename=$(basename "$file")
            log_info "  Copying: $filename"
            cp "$file" "$target_docs/$filename"
        fi
    done

    log_info "Verifying checksums..."

    local source_sum=$(shasum -a 256 "$SOURCE_DOCS"/000-*.md 2>/dev/null | sort)
    local target_sum=$(shasum -a 256 "$target_docs"/000-*.md 2>/dev/null | sort)

    # Compare just the checksums (not paths)
    local source_hashes=$(echo "$source_sum" | awk '{print $1}' | sort)
    local target_hashes=$(echo "$target_sum" | awk '{print $1}' | sort)

    if [ "$source_hashes" = "$target_hashes" ]; then
        log_info "Checksums verified - sync complete!"
        return 0
    else
        log_error "Checksum mismatch!"
        return 1
    fi
}

# Show current checksums (no sync)
show_checksums() {
    log_info "Current canonical doc checksums (irsb-solver):"
    echo ""
    get_checksums "$SOURCE_DOCS"
}

# Main
if [ $# -eq 0 ]; then
    show_checksums
    echo ""
    log_info "Usage: $0 <target-repo-path>"
    log_info "Example: $0 ../irsb-protocol"
    exit 0
fi

sync_to_repo "$1"
