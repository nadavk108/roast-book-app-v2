#!/bin/bash

# Vercel Environment Variables Setup Script
# This script helps you set all required environment variables in Vercel

echo "🚀 Vercel Environment Variables Setup"
echo "======================================"
echo ""
echo "This script will help you set all required environment variables."
echo "You'll need to paste values from your .env.local file."
echo ""
echo "Press Ctrl+C at any time to cancel."
echo ""

# Function to add env var
add_env() {
  local name=$1
  local description=$2

  echo ""
  echo "📝 Setting: $name"
  echo "   ($description)"

  npx vercel env add "$name" production

  if [ $? -eq 0 ]; then
    echo "✅ $name added successfully"
  else
    echo "❌ Failed to add $name"
  fi
}

# Supabase
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 SUPABASE CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
add_env "NEXT_PUBLIC_SUPABASE_URL" "Your Supabase project URL"
add_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Your Supabase anon key"
add_env "SUPABASE_SERVICE_ROLE_KEY" "Your Supabase service role key"

# AI Services
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 AI SERVICES CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
add_env "OPENAI_API_KEY" "OpenAI API key for vision analysis"
add_env "ANTHROPIC_API_KEY" "Anthropic API key for quote generation"
add_env "REPLICATE_API_TOKEN" "Replicate API token for image generation"

echo ""
read -p "Do you want to add GEMINI_API_KEY (optional)? (y/n): " add_gemini
if [ "$add_gemini" = "y" ]; then
  add_env "GEMINI_API_KEY" "Google Gemini API key (optional)"
fi

# Stripe
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💳 STRIPE CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
add_env "STRIPE_SECRET_KEY" "Stripe secret key"
add_env "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "Stripe publishable key"
add_env "STRIPE_WEBHOOK_SECRET" "Stripe webhook secret (use whsec_placeholder for now)"

# App Config
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  APP CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "For NEXT_PUBLIC_APP_URL, enter: https://theroastbook.com"
add_env "NEXT_PUBLIC_APP_URL" "Production app URL"

echo ""
echo "For NEXT_PUBLIC_BASE_URL, enter: https://theroastbook.com"
add_env "NEXT_PUBLIC_BASE_URL" "Production base URL"

echo ""
echo "For BOOK_PRICE_CENTS, enter: 999"
add_env "BOOK_PRICE_CENTS" "Book price in cents"

# PostHog (optional)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 ANALYTICS (OPTIONAL)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "Do you want to add PostHog analytics? (y/n): " add_posthog
if [ "$add_posthog" = "y" ]; then
  add_env "NEXT_PUBLIC_POSTHOG_KEY" "PostHog project key"
  echo ""
  echo "For NEXT_PUBLIC_POSTHOG_HOST, enter: https://us.i.posthog.com"
  add_env "NEXT_PUBLIC_POSTHOG_HOST" "PostHog host URL"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ENVIRONMENT VARIABLES SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Deploy to production: npx vercel --prod"
echo "2. Test the deployment URL"
echo "3. Add custom domain in Vercel dashboard"
echo "4. Update DNS in GoDaddy"
echo ""
echo "For detailed instructions, see: QUICK_START_DEPLOYMENT.md"
echo ""
