#!/usr/bin/env node

/**
 * Script to create a Linear ticket using the Linear API
 *
 * Usage:
 * 1. Get your API key from: https://linear.app/settings/api
 * 2. Set environment variable: export LINEAR_API_KEY="your-key-here"
 * 3. Run: node scripts/create-linear-ticket.js
 */

const https = require('https');

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.error('Error: LINEAR_API_KEY environment variable not set');
  console.error('Get your API key from: https://linear.app/settings/api');
  console.error('Then run: export LINEAR_API_KEY="your-key-here"');
  process.exit(1);
}

// GraphQL mutation to create an issue
const mutation = `
  mutation CreateIssue($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue {
        id
        identifier
        title
        url
      }
    }
  }
`;

// You'll need to replace TEAM_ID with your actual team ID
// Find it by running: curl -H "Authorization: YOUR_KEY" https://api.linear.app/graphql -d '{"query":"{ teams { nodes { id name } } }"}'
const variables = {
  input: {
    // teamId: "YOUR_TEAM_ID", // Replace with your team ID
    title: "Allow paying users to download all images",
    description: `Enable users who have paid for their book to download all images from their flipbook in a convenient format (e.g., ZIP archive).

## Problem
Currently, paying users can view their complete flipbook but cannot easily download all the generated images for offline use or sharing outside the platform.

## Proposed Solution
Add a "Download All Images" button on the book page (or preview page) that:
- Is only visible to users who have paid for the book
- Packages all book images into a ZIP file
- Triggers a browser download of the archive

## Acceptance Criteria
- [ ] Download button appears only for paid books (or admin-created books)
- [ ] Button generates a ZIP archive containing all book images
- [ ] Images are named sequentially (e.g., page-01.png, page-02.png)
- [ ] Download works on both desktop and mobile browsers
- [ ] Loading state is shown while generating the archive

## Technical Considerations
- Need to decide: client-side ZIP generation (JSZip library) or server-side endpoint
- Consider image size/quality in the download
- May need rate limiting to prevent abuse
- Should work for books accessed via \`/preview/[id]\` or \`/book/[slug]\``,
    priority: 2, // 0 = No priority, 1 = Urgent, 2 = High, 3 = Medium, 4 = Low
  }
};

const data = JSON.stringify({
  query: mutation,
  variables: variables
});

const options = {
  hostname: 'api.linear.app',
  port: 443,
  path: '/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': LINEAR_API_KEY,
    'Content-Length': data.length
  }
};

console.log('Creating Linear ticket...');

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    const response = JSON.parse(responseData);

    if (response.errors) {
      console.error('Error creating ticket:');
      console.error(JSON.stringify(response.errors, null, 2));

      if (response.errors[0]?.message?.includes('teamId')) {
        console.error('\nYou need to set the teamId in the script.');
        console.error('Find your team ID by running:');
        console.error('curl -H "Authorization: ' + LINEAR_API_KEY + '" https://api.linear.app/graphql -d \'{"query":"{ teams { nodes { id name } } }"}\'');
      }
    } else if (response.data?.issueCreate?.success) {
      const issue = response.data.issueCreate.issue;
      console.log('✓ Ticket created successfully!');
      console.log(`  ID: ${issue.identifier}`);
      console.log(`  Title: ${issue.title}`);
      console.log(`  URL: ${issue.url}`);
    } else {
      console.error('Unexpected response:', JSON.stringify(response, null, 2));
    }
  });
});

req.on('error', (e) => {
  console.error('Error making request:', e);
});

req.write(data);
req.end();
