# ✅ Pre-Demo Checklist for Hack2Build

Use this checklist to ensure you're ready for the hackathon demo!

## 🔧 Technical Setup

### Smart Contracts

- [ ] All 3 contracts deployed to Avalanche Fuji testnet
  - [ ] X402Payment.sol
  - [ ] ERC8004Token.sol
  - [ ] PredictionMarket.sol
- [ ] All contracts verified on Snowtrace
- [ ] Contract addresses saved and added to `.env`
- [ ] Test transactions executed successfully
- [ ] Gas usage benchmarked and documented

### Frontend

- [ ] `.env` file configured with all variables
- [ ] Firebase project connected
- [ ] Firestore rules deployed
- [ ] Cloud Functions deployed (optional)
- [ ] Test AVAX in demo wallet
- [ ] MetaMask connected to Fuji testnet
- [ ] App deployed to Netlify/Vercel
- [ ] Custom domain configured (optional)

### Database

- [ ] At least 5 sample markets created
- [ ] Markets have realistic titles and options
- [ ] Some markets are settled (to show payouts)
- [ ] Test user account with positions
- [ ] Admin account configured

### New Components

- [ ] AIInsights component integrated on market pages
- [ ] GasComparison component on landing page
- [ ] PaymentStatus modal working
- [ ] All animations smooth
- [ ] Mobile responsive

---

## 📱 Device Preparation

### Primary Demo Device

- [ ] Laptop/computer fully charged
- [ ] Backup power cable available
- [ ] Screen resolution tested (1920x1080 recommended)
- [ ] Browser zoom at 100%
- [ ] Browser cache cleared
- [ ] MetaMask installed and configured
- [ ] Multiple tabs pre-opened:
  - [ ] Live demo site
  - [ ] Snowtrace (contract verification)
  - [ ] GitHub repo
  - [ ] Google Slides (if using)

### Backup Device

- [ ] Phone/tablet with mobile demo ready
- [ ] Same wallet configured
- [ ] Mobile responsive design tested

### Internet

- [ ] Stable WiFi connection tested
- [ ] Mobile hotspot as backup
- [ ] VPN disabled (can slow things down)

---

## 🎬 Content Preparation

### Presentation Materials

- [ ] Pitch deck reviewed (PITCH_DECK.md)
- [ ] Demo script memorized (DEMO_SCRIPT.md)
- [ ] Talking points for each slide
- [ ] Timing practiced (under 5 minutes)
- [ ] Q&A answers prepared

### Video Backup

- [ ] Screen recording of full demo
- [ ] Video edited and polished
- [ ] Video uploaded (YouTube/Loom)
- [ ] Video link ready to share
- [ ] Subtitles added (accessibility)

### Documentation

- [ ] README.md updated with hackathon info
- [ ] HACKATHON_SUBMISSION.md complete
- [ ] All contract addresses listed
- [ ] Screenshots/GIFs of key features
- [ ] License file (MIT recommended)

---

## 🧪 Testing

### User Flow Testing

- [ ] Wallet connection works (MetaMask)
- [ ] Network auto-switches to Avalanche Fuji
- [ ] Markets load correctly
- [ ] AI insights appear on markets
- [ ] Gas comparison shows correctly
- [ ] Betting flow smooth:
  - [ ] Click YES/NO
  - [ ] Enter amount
  - [ ] See payment status modal
  - [ ] Payment streams (animated)
  - [ ] Position appears in account
- [ ] No console errors
- [ ] All links work

### Mobile Testing

- [ ] Responsive on iPhone
- [ ] Responsive on Android
- [ ] Touch targets large enough
- [ ] Modals work properly
- [ ] MetaMask mobile app integration

### Performance Testing

- [ ] Page load < 3 seconds
- [ ] No layout shift
- [ ] Images optimized
- [ ] Smooth animations
- [ ] Fast Firestore queries

---

## 📊 Metrics to Highlight

### Prepare These Numbers

- [ ] Gas savings: **30%** vs traditional
- [ ] Transaction count: **1** vs 2
- [ ] Cost per bet: **$0.05** vs $0.15
- [ ] Finality time: **<1 second**
- [ ] Payout gas: **$0** (automatic)
- [ ] User clicks: **50% fewer**
- [ ] Market size: **$200M+** annually

### Demo Metrics

- [ ] Test bet amount chosen (100 credits recommended)
- [ ] Gas comparison numbers verified
- [ ] AI confidence score realistic (60-90%)
- [ ] Suggested stake amounts reasonable

---

## 🎤 Presentation Skills

### Before Demo

- [ ] Practice run-through (3+ times)
- [ ] Timing under 5 minutes
- [ ] Voice clear and confident
- [ ] Pace not too fast
- [ ] Eye contact (not reading slides)
- [ ] Enthusiasm for project

### During Demo

- [ ] Start with hook ("30% gas savings...")
- [ ] Show problem first (traditional flow)
- [ ] Then show solution (Bench)
- [ ] Live demo (not just slides)
- [ ] Handle errors gracefully
- [ ] End with strong closing

### Q&A Preparation

- [ ] "How does x402 differ from ERC20?"
- [ ] "What makes ERC8004 special?"
- [ ] "Why Avalanche?"
- [ ] "How does the AI work?"
- [ ] "What's your revenue model?"
- [ ] "How do you prevent manipulation?"
- [ ] "Is this production-ready?"

---

## 🔗 Links to Have Ready

### Live Demo

```
Production URL: https://your-site.netlify.app
Testnet: Avalanche Fuji (Chain ID: 43113)
Faucet: https://faucet.avax.network/
```

### Contracts (Snowtrace)

```
X402Payment: https://testnet.snowtrace.io/address/0x...
ERC8004Token: https://testnet.snowtrace.io/address/0x...
PredictionMarket: https://testnet.snowtrace.io/address/0x...
```

### GitHub

```
Repository: https://github.com/yourusername/bench-prediction-market
README: Full documentation
License: MIT (open source)
```

### Video Demo

```
YouTube/Loom: https://youtu.be/...
Duration: 5 minutes
Shows: Complete user flow
```

---

## 🎯 Demo Flow Checklist

### Part 1: Introduction (30 sec)

- [ ] State name and project
- [ ] State hook (30% gas savings)
- [ ] Brief overview

### Part 2: Problem (30 sec)

- [ ] Show traditional ERC20 flow
- [ ] Show gas comparison
- [ ] Highlight pain points

### Part 3: x402 Solution (60 sec)

- [ ] Navigate to market
- [ ] Show AI insights
- [ ] Place bet
- [ ] Show payment streaming
- [ ] Highlight savings

### Part 4: AI Integration (45 sec)

- [ ] Show AI confidence score
- [ ] Explain risk assessment
- [ ] Show suggested bet size
- [ ] Mention Kelly Criterion

### Part 5: ERC8004 (45 sec)

- [ ] Show settled market
- [ ] Show automatic payout
- [ ] Explain conditional transfers
- [ ] Highlight zero gas

### Part 6: Technical (30 sec)

- [ ] Show architecture
- [ ] Mention security features
- [ ] Show verified contracts
- [ ] Highlight Avalanche benefits

### Part 7: Impact (30 sec)

- [ ] State market size ($200M+)
- [ ] Explain business model (2.5% fee)
- [ ] Show user benefits
- [ ] Mention social impact

### Part 8: Closing (20 sec)

- [ ] Summarize 3 key innovations
- [ ] Strong closing line
- [ ] Thank judges
- [ ] Open for questions

---

## 🚨 Common Issues & Fixes

### Issue: MetaMask Not Connecting

**Fix:**

- Refresh page
- Check MetaMask is unlocked
- Try different browser
- Use mobile backup

### Issue: Transaction Failing

**Fix:**

- Check test AVAX balance
- Check gas price
- Check contract addresses
- Use pre-recorded demo video

### Issue: Firestore Not Loading

**Fix:**

- Check Firebase config
- Check internet connection
- Use cached data
- Switch to backup account

### Issue: Demo Running Slow

**Fix:**

- Close unnecessary tabs
- Clear browser cache
- Use wired internet
- Restart browser

---

## 📱 Social Media (Optional)

### Pre-Launch

- [ ] Tweet about participation
- [ ] Post on LinkedIn
- [ ] Share in Discord
- [ ] Tag @avalancheavax

### During Hackathon

- [ ] Live tweet progress
- [ ] Share screenshots
- [ ] Post demo video
- [ ] Engage with community

### Post-Launch

- [ ] Share results
- [ ] Thank organizers
- [ ] Post-mortem blog
- [ ] Open source repo promoted

---

## ✨ Final Checks (30 min before)

### Technical

- [ ] All tabs open and tested
- [ ] Wallet has test AVAX
- [ ] Demo account logged in
- [ ] Internet stable
- [ ] Backup plan ready

### Personal

- [ ] Water nearby
- [ ] Phone on silent
- [ ] Comfortable clothes
- [ ] Deep breath
- [ ] Confident mindset

### Environment

- [ ] Quiet location
- [ ] Good lighting (if video)
- [ ] Minimal background noise
- [ ] Laptop on stable surface
- [ ] Charger plugged in

---

## 🎉 Post-Demo Actions

### Immediately After

- [ ] Save any recordings
- [ ] Thank judges
- [ ] Network with other teams
- [ ] Note any feedback received

### Within 24 Hours

- [ ] Submit any follow-up materials
- [ ] Share demo video publicly
- [ ] Write blog post
- [ ] Thank organizers

### Long Term

- [ ] Implement judge feedback
- [ ] Continue development
- [ ] Build community
- [ ] Consider mainnet launch

---

## 🏆 Success Criteria

You're ready to demo when:

- ✅ All components working smoothly
- ✅ Demo takes < 5 minutes
- ✅ You can explain each innovation clearly
- ✅ Backup plan in place
- ✅ You're excited and confident!

---

## 💪 Motivational Reminders

**You've built something amazing:**

- ✅ First x402 + ERC8004 + AI platform
- ✅ 30% gas savings (measurable impact)
- ✅ Beautiful, polished UI
- ✅ Real-world use case
- ✅ Comprehensive documentation

**The judges will love:**

- Your innovation (combining 3 standards)
- Your execution (working demo)
- Your impact (helping users save money)
- Your presentation (clear and confident)

**Remember:**

- Be yourself
- Show your passion
- It's okay to be nervous
- You've got this! 🚀

---

## 📞 Emergency Contacts

**If something goes wrong:**

- Hackathon Discord: [Link]
- Organizer email: [Email]
- Tech support: [Contact]
- Your team: [Numbers]

---

**Good luck! You've prepared well and built something truly innovative. Now go show them what Bench can do! 🏆**


