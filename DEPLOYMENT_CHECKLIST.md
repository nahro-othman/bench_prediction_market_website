# ✅ Netlify Deployment Checklist

Follow this checklist to deploy your Bench Prediction Market to Netlify.

---

## 📦 Pre-Deployment

### 1. **Test Locally**
```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

✅ Build completes without errors  
✅ App works correctly in preview mode  
✅ MetaMask connects successfully  
✅ Markets load properly  

---

### 2. **Prepare Git Repository**
```bash
# Commit all changes
git add .
git commit -m "Prepare for Netlify deployment"

# Push to your repository
git push origin main
```

✅ All changes committed  
✅ Code pushed to GitHub/GitLab/Bitbucket  
✅ `.env` file is in `.gitignore` (DO NOT commit secrets!)  

---

### 3. **Gather Environment Variables**

#### Firebase (from Firebase Console):
- [ ] `PUBLIC_FIREBASE_API_KEY`
- [ ] `PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `PUBLIC_FIREBASE_APP_ID`

#### Avalanche (Fuji Testnet):
- [ ] `PUBLIC_AVALANCHE_RPC_URL` = `https://api.avax-test.network/ext/bc/C/rpc`
- [ ] `PUBLIC_CHAIN_ID` = `43113`

#### Smart Contracts (from deployment):
- [ ] `PUBLIC_PREDICTION_MARKET_CONTRACT`
- [ ] `PUBLIC_X402_PAYMENT_CONTRACT`
- [ ] `PUBLIC_ERC8004_TOKEN_CONTRACT`

---

## 🚀 Deployment Steps

### Step 1: Create Netlify Site

1. Go to [Netlify](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose your Git provider
4. Select `bench_prediction_market_website` repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
   - **Branch:** `main`

✅ Site created on Netlify  
✅ Build settings configured  

---

### Step 2: Add Environment Variables

1. Go to **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Add each variable from your list above

**Important:** Copy-paste carefully! One typo can break the deployment.

✅ All Firebase variables added  
✅ All Avalanche variables added  
✅ All contract addresses added  

---

### Step 3: Deploy

1. Click **"Deploy site"**
2. Wait for build to complete (2-5 minutes)
3. Check build logs for errors

✅ Build successful  
✅ No errors in logs  
✅ Site is live!  

---

## 🧪 Post-Deployment Testing

### Test on Production Site

Visit your Netlify URL: `https://your-site-name.netlify.app`

#### Basic Tests:
- [ ] Site loads without errors
- [ ] Home page displays correctly
- [ ] Markets are visible
- [ ] Responsive design works on mobile

#### Wallet Tests:
- [ ] MetaMask extension detected
- [ ] Can connect wallet
- [ ] Wallet address displays in navbar
- [ ] AVAX balance shows correctly
- [ ] Network switches to Avalanche Fuji

#### Betting Tests:
- [ ] Can open bet dialog
- [ ] Stake input works
- [ ] Quick stake buttons work
- [ ] Can place a bet (with testnet AVAX)
- [ ] Position appears in account page

#### Navigation Tests:
- [ ] All pages load (Home, Account, Admin, Login)
- [ ] Links work correctly
- [ ] Back button works
- [ ] Direct URL access works

---

## 🔧 Troubleshooting

### Build Fails

**Check:**
- Build logs in Netlify dashboard
- All dependencies in `package.json`
- Node version (should be 18)

**Fix:**
```bash
# Test locally first
npm run build
```

---

### Site Loads But Features Don't Work

**Check:**
- Browser console for errors (F12)
- Environment variables are set correctly
- No typos in variable names
- Variables start with `PUBLIC_` prefix

**Fix:**
1. Go to Site settings → Environment variables
2. Verify each variable
3. Trigger new deploy: **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

---

### MetaMask Won't Connect

**Check:**
- `PUBLIC_CHAIN_ID` = `43113`
- `PUBLIC_AVALANCHE_RPC_URL` is correct
- MetaMask is installed
- User is on correct network

**Fix:**
- Add Avalanche Fuji network to MetaMask manually
- Check browser console for errors

---

### Markets Don't Load

**Check:**
- Firebase configuration is correct
- Firestore database has data
- Browser console for errors

**Fix:**
1. Verify Firebase variables
2. Check Firestore rules allow read access
3. Run the seed script to add test data

---

## 🎯 Optional Enhancements

### Custom Domain
1. **Site settings** → **Domain management**
2. **Add custom domain**
3. Update DNS records with your registrar
4. Wait for DNS propagation (up to 48 hours)

✅ Custom domain added  
✅ DNS configured  
✅ SSL certificate active  

---

### Branch Deploys
1. **Site settings** → **Build & deploy** → **Continuous deployment**
2. Enable **Deploy Previews** for pull requests
3. Enable **Branch deploys** for specific branches

✅ Preview deploys enabled  
✅ Branch deploys configured  

---

### Notifications
1. **Site settings** → **Build & deploy** → **Deploy notifications**
2. Add email or Slack notifications
3. Get notified on successful/failed deploys

✅ Notifications configured  

---

## 📊 Monitoring

### Check These Regularly:

- **Deploy logs:** Ensure builds are successful
- **Analytics:** Monitor traffic (if enabled)
- **Error tracking:** Check for runtime errors
- **Performance:** Use Lighthouse for optimization

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Site is accessible at Netlify URL  
✅ All pages load without errors  
✅ MetaMask connects successfully  
✅ Users can view markets  
✅ Users can place bets with AVAX  
✅ Responsive design works on mobile  
✅ No console errors  

---

## 📝 Next Steps

After successful deployment:

1. **Share your site** with users
2. **Get testnet AVAX** from [Avalanche Faucet](https://faucet.avax.network/)
3. **Test thoroughly** with real users
4. **Monitor** for errors and issues
5. **Iterate** based on feedback

---

## 🆘 Need Help?

- **Netlify Docs:** https://docs.netlify.com/
- **Netlify Support:** https://answers.netlify.com/
- **SvelteKit Docs:** https://kit.svelte.dev/docs/adapter-netlify

---

**🚀 Ready to deploy? Let's go!**

```bash
# Quick deploy via CLI
netlify login
netlify init
netlify deploy --prod
```

Or use the Netlify UI for a guided experience!


