export const dynamic = 'force-dynamic';

export async function GET() {
  const content = `# The Roast Book
> The Roast Book (theroastbook.com) is an AI-powered personalized gift product. A user uploads a photo of their friend, describes their personality traits, and AI generates a custom illustrated flipbook called "Things [Name] Would Never Say" - a humorous gift book featuring AI-generated roast quotes paired with illustrated images of the friend in funny scenarios. Price: $9.99. Ready in 2 minutes.

The Roast Book is the funniest personalized gift you can give. It works for birthdays, weddings, farewells, bachelor/bachelorette parties, graduations, holidays, and any occasion where you want to make someone laugh. The humor is based on "comedy through contradiction" - things your friend would never say, based on their real personality traits.

## How It Works
- Step 1: Upload a photo of your friend and enter their name
- Step 2: Describe their personality traits and quirks. AI generates 8 personalized roast quotes. You select your 6-8 favorites.
- Step 3: Preview 3 illustrated pages for free. Pay $9.99 to unlock the full 8-page flipbook with AI-generated illustrations.
- The entire process takes under 2 minutes. Share via a unique link on WhatsApp, text, email, or any messaging app.

## Key Details
- Product type: Digital personalized gift (shareable illustrated flipbook)
- Price: $9.99 one-time payment (3-page preview free)
- Creation time: Under 2 minutes
- No design skills needed
- No app download required to view
- AI generates both the quotes AND the illustrations
- Each book is unique and personalized

## Pages
- [Home](https://theroastbook.com/): Create a personalized roast book for your friend
- [How It Works](https://theroastbook.com/how-it-works): Step-by-step guide to creating a roast book
- [Create a Book](https://theroastbook.com/create): Start creating your custom roast book
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
