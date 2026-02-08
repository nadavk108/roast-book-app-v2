#!/usr/bin/env node

const { LinearClient } = require('@linear/sdk');

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || 'lin_api_dL5IrZXlTlVbKMWbDAZYequ6AtCI13ZfFi5LSEzLM';

const client = new LinearClient({
  apiKey: LINEAR_API_KEY
});

async function createTicket() {
  try {
    console.log('Testing authentication...');

    // First, verify authentication by getting viewer info
    const viewer = await client.viewer;
    console.log(`✓ Authenticated as: ${viewer.name} (${viewer.email})`);

    // Get teams
    console.log('\nFetching teams...');
    const teams = await client.teams();

    if (teams.nodes.length === 0) {
      console.error('Error: No teams found. Please make sure you have access to at least one team.');
      process.exit(1);
    }

    console.log(`✓ Found ${teams.nodes.length} team(s):`);
    teams.nodes.forEach((team, i) => {
      console.log(`  ${i + 1}. ${team.name} (${team.key})`);
    });

    // Use the first team by default
    const teamId = teams.nodes[0].id;
    console.log(`\n✓ Using team: ${teams.nodes[0].name}`);

    // Create the issue
    console.log('\nCreating issue...');
    const issuePayload = {
      teamId: teamId,
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
    };

    const result = await client.createIssue(issuePayload);
    const issue = await result.issue;

    if (issue) {
      console.log('\n✅ Ticket created successfully!');
      console.log(`  ID: ${issue.identifier}`);
      console.log(`  Title: ${issue.title}`);
      console.log(`  URL: ${issue.url}`);
    } else {
      console.error('\n❌ Failed to create ticket');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

createTicket();
