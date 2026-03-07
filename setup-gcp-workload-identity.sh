#!/bin/bash
#
# Smart ERP - GCP Workload Identity Setup
# Run this locally to set up GCP infrastructure for GitHub Actions
# No service account keys needed - uses your logged-in Google account
#

set -e

echo "============================================"
echo "  Smart ERP - GCP Workload Identity Setup"
echo "============================================"
echo ""

# Check prerequisites
if ! command -v gcloud &> /dev/null; then
    echo "ERROR: gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get GCP Project ID
read -p "Enter your GCP Project ID: " GCP_PROJECT_ID
if [ -z "$GCP_PROJECT_ID" ]; then
    echo "ERROR: GCP Project ID is required"
    exit 1
fi

# Get GCP Region
read -p "Enter GCP Region [us-central1]: " GCP_REGION
GCP_REGION=${GCP_REGION:-us-central1}

# Get GitHub info
read -p "Enter GitHub Username: " GITHUB_OWNER
if [ -z "$GITHUB_OWNER" ]; then
    echo "ERROR: GitHub Username is required"
    exit 1
fi

GITHUB_REPO="smart-erp"

echo ""
echo "Configuration:"
echo "  GCP Project: $GCP_PROJECT_ID"
echo "  GCP Region:  $GCP_REGION"
echo "  GitHub User: $GITHUB_OWNER"
echo "  GitHub Repo: $GITHUB_REPO"
echo ""

# Check GCP auth
echo "Checking GCP authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "ERROR: Not logged into GCP. Run 'gcloud auth login' first."
    exit 1
fi

GCP_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
echo "  ✓ Logged in as: $GCP_ACCOUNT"
echo ""

# Set project
echo "Setting GCP project..."
gcloud config set project $GCP_PROJECT_ID
echo ""

# Enable APIs
echo "Enabling required APIs..."
gcloud services enable \
    iamcredentials.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    --quiet
echo ""

# Create Workload Identity Pool
POOL_NAME="github-pool"
echo "Creating Workload Identity Pool: $POOL_NAME..."
gcloud iam workload-identity-pools create $POOL_NAME \
    --location="global" \
    --display-name="GitHub Actions Pool" \
    --description="Workload Identity Pool for GitHub Actions" \
    2>/dev/null || echo "  (Pool already exists)"
echo ""

# Create Provider
PROVIDER_NAME="github-provider"
echo "Creating GitHub OIDC Provider: $PROVIDER_NAME..."
gcloud iam workload-identity-pools providers create-github $PROVIDER_NAME \
    --location="global" \
    --workload-identity-pool="$POOL_NAME" \
    --owner-repository="$GITHUB_OWNER/$GITHUB_REPO" \
    --description="GitHub Actions OIDC Provider" \
    2>/dev/null || echo "  (Provider already exists)"
echo ""

# Create Service Account
SA_NAME="github-actions-sa"
echo "Creating Service Account: $SA_NAME..."
gcloud iam service-accounts create $SA_NAME \
    --display-name="GitHub Actions SA" \
    --description="Service Account for GitHub Actions deployments" \
    2>/dev/null || echo "  (SA already exists)"
echo ""

SA_EMAIL="$SA_NAME@$GCP_PROJECT_ID.iam.gserviceaccount.com"

# Get pool ID
POOL_ID=$(gcloud iam workload-identity-pools describe $POOL_NAME \
    --location="global" \
    --format="value(name)")

# Grant permissions
echo "Granting Cloud Run permissions..."
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/${GITHUB_OWNER}/${GITHUB_REPO}" \
    --role="roles/run.admin" \
    --role="roles/artifactregistry.admin" \
    --role="roles/iam.serviceAccountUser" \
    --quiet 2>/dev/null || echo "  (Permissions may already exist)"
echo ""

# Generate provider resource
PROVIDER_RESOURCE="$POOL_ID/providers/$PROVIDER_NAME"

# Generate secrets output
echo "============================================"
echo "✅ SETUP COMPLETE!"
echo "============================================"
echo ""
echo "Add these 4 secrets to GitHub (Settings → Secrets → Actions):"
echo ""
echo "  1. GCP_PROJECT_ID"
echo "     Value: $GCP_PROJECT_ID"
echo ""
echo "  2. GCP_REGION"
echo "     Value: $GCP_REGION"
echo ""
echo "  3. GCP_WORKLOAD_IDENTITY_PROVIDER"
echo "     Value: $PROVIDER_RESOURCE"
echo ""
echo "  4. GCP_SERVICE_ACCOUNT"
echo "     Value: $SA_EMAIL"
echo ""
echo "============================================"
echo ""
echo "After adding secrets, push to main branch to trigger deployment!"
echo ""
