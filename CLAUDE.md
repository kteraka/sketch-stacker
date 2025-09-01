# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Gyazo-like image sharing application with AWS backend infrastructure and a React frontend. The system allows users to upload images via API Gateway + Lambda, stores them in S3, and serves them through CloudFront. A web viewer displays uploaded images in a gallery format.

## Architecture

### Backend (AWS CloudFormation)
- **API Gateway + Lambda**: Image upload endpoint with Basic Authentication
- **S3**: Image storage with Glacier Instant Retrieval storage class
- **CloudFront**: CDN for image delivery with Origin Access Control (OAC)
- **Secrets Manager**: Basic authentication password management
- **Auto-indexing**: S3 event triggers Lambda to update images.json automatically

### Frontend
- **Legacy**: Static HTML viewer (`/Viewer/index.html`)
- **Modern**: React SPA using Vite (`/viewer-react/`)

## Development Commands

### React Frontend (Primary Development)
```bash
cd viewer-react
npm install                    # Install dependencies
npm run dev -- --host         # Start dev server (required for Dev Container)
npm run build                  # Build for production
npm run lint                   # Run ESLint
npm run preview                # Preview production build
```

### CloudFormation Deployment
```bash
# Deploy infrastructure stack
aws cloudformation create-stack --stack-name WIPUploader --template-body file://Uploader/template.yaml --parameters ParameterKey=ImageBucketName,ParameterValue=<bucket-name> --capabilities CAPABILITY_IAM

# Update existing stack
aws cloudformation update-stack --stack-name WIPUploader --template-body file://Uploader/template.yaml --parameters ParameterKey=ImageBucketName,ParameterValue=<bucket-name>
```

### Image Upload API Usage
```bash
AUTH=$(echo -n '<username>:<password>' | base64)
IMAGE=$(base64 -i test.png)
curl -X POST \
  -H "Authorization: Basic $AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$IMAGE\"}" \
  <API_GATEWAY_ENDPOINT>
```

## Code Architecture

### React Components Structure
- `src/App.jsx`: Main application component
- `src/components/ImageGallery.jsx`: Main gallery container with data fetching
- `src/components/ImageItem.jsx`: Individual image item with controls
- `src/components/Modal.jsx`: Image preview modal

### Development vs Production Behavior
The React app uses environment-based configuration:
- **Development**: Uses test data (`/test-images.json`) and placeholder images
- **Production**: Connects to actual CloudFront for real data and images

### Data Flow
1. Images uploaded via API Gateway → Lambda → S3
2. S3 event triggers `UpdateImagesJsonLambda` → updates `images.json`
3. CloudFront invalidates cache for `images.json`
4. Frontend fetches updated `images.json` and displays images

### Image Filename Convention
Images are stored with timestamp-based filenames (e.g., `1736680321651.png`). The frontend extracts timestamps to display upload dates.

## Dev Container Considerations

This project uses Claude Code's Dev Container with network restrictions. External HTTPS connections to CloudFront are blocked by default. For CloudFront testing:

1. **Development**: Use mock data and placeholder images
2. **Testing with real data**: Build production version and serve locally on Mac
3. **Custom firewall**: A custom firewall script exists in `.devcontainer/custom-firewall.sh` to potentially allow CloudFront access, but requires container rebuild

### Vite Configuration Notes
The `vite.config.js` includes:
- `host: true` for Dev Container compatibility
- Proxy configuration for CloudFront (may not work due to network restrictions)
- Port forwarding setup in `devcontainer.json` for port 5173

## CloudFormation Parameters
When deploying the infrastructure stack, note the circular dependency issue with `CloudFrontDistributionId` parameter. First deploy with a dummy value, then update with the actual distribution ID after creation.

## Future Development Plans
See `DEVELOPMENT_PLAN.md` for detailed roadmap including:
- Terraform migration from CloudFormation
- GitHub Actions CI/CD setup
- UI/UX improvements
- GitHub-style contribution calendar feature