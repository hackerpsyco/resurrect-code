# Quick Test Guide - Scheduled Automation Fixes

## 🧪 Test 1: Time Display with AM/PM

**Steps**:
1. Open Settings → Analysis Automation
2. Set Schedule to "Daily"
3. Set Time to 14:30 (2:30 PM)
4. Look next to time picker

**Expected Result**:
- Should see "2:30 PM" displayed
- Should see "⏰ Analysis will run daily at 2:30 PM UTC"

**Status**: ✅ Pass / ❌ Fail

---

## 🧪 Test 2: Repository Selection Persistence

**Steps**:
1. Open Settings → Analysis Automation
2. Select 2-3 GitHub repositories
3. Click Save
4. Refresh page (F5)
5. Check if selections are still there

**Expected Result**:
- Checkboxes should still be checked
- Count should show selected repos
- No need to reselect

**Status**: ✅ Pass / ❌ Fail

---

## 🧪 Test 3: Project Selection Persistence

**Steps**:
1. Open Settings → Analysis Automation
2. Select 1-2 Vercel projects
3. Click Save
4. Refresh page (F5)
5. Check if selections are still there

**Expected Result**:
- Checkboxes should still be checked
- Count should show selected projects
- No need to reselect

**Status**: ✅ Pass / ❌ Fail

---

## 🧪 Test 4: Scheduler Starts

**Steps**:
1. Open browser console (F12)
2. Go to Console tab
3. Refresh page
4. Look for scheduler logs

**Expected Result**:
- Should see: `🚀 Initializing scheduler service...`
- Should see: `🚀 Scheduler started`
- Should see: `📅 Scheduling jobs: ...`

**Status**: ✅ Pass / ❌ Fail

---

## 🧪 Test 5: Daily Schedule Calculation

**Steps**:
1. Open Settings → Analysis Automation
2. Select repositories and projects
3. Set Schedule to "Daily"
4. Set Time to current time + 1 minute
5. Click Save
6. Open browser console
7. Wait for scheduled time

**Expected Result**:
- Should see: `⏰ Daily job scheduled in X minutes`
- At scheduled time, should see: `🔔 Daily job triggered`
- Analysis should run
- Email should be sent

**Status**: ✅ Pass / ❌ Fail

---

## 🧪 Test 6: Weekly Schedule Calculation

**Steps**:
1. Open Settings → Analysis Automation
2. Select repositories and projects
3. Set Schedule to "Weekly"
4. Set Time to current time + 1 minute
5. Click Save
6. Open browser console

**Expected Result**:
- Should see: `⏰ Weekly job scheduled in X hours`
- Should mention next Monday
- At scheduled time, analysis should run

**Status**: ✅ Pass / ❌ Fail

---

## 🧪 Test 7: Settings Save with Scheduler Restart

**Steps**:
1. Open Settings → Analysis Automation
2. Select repositories
3. Set Schedule to "Daily"
4. Set Time to 14:30
5. Click Save
6. Open browser console
7. Change time to 15:30
8. Click Save again

**Expected Result**:
- First save: scheduler starts
- Second save: scheduler restarts with new time
- Should see: `🔄 Restarting scheduler...`
- New time should be scheduled

**Status**: ✅ Pass / ❌ Fail

---

## 🧪 Test 8: Email Notification

**Steps**:
1. Open Settings → Analysis Automation
2. Enable "Email Notifications"
3. Enter your email
4. Select repositories
5. Set Schedule to "Daily"
6. Set Time to current time + 1 minute
7. Click Save
8. Wait for scheduled time

**Expected Result**:
- At scheduled time, analysis runs
- Email should be sent to your email
- Email should contain analysis results
- Email should include PR link

**Status**: ✅ Pass / ❌ Fail

---

## 📋 Checklist

- [ ] Time displays with AM/PM
- [ ] Repos persist after refresh
- [ ] Projects persist after refresh
- [ ] Scheduler starts on app load
- [ ] Daily schedule calculates correctly
- [ ] Weekly schedule calculates correctly
- [ ] Settings save triggers scheduler restart
- [ ] Email sends at scheduled time

---

## 🐛 Troubleshooting

### Time Not Showing AM/PM
- Refresh page
- Check browser console for errors
- Verify schedule is set to Daily or Weekly

### Selections Not Persisting
- Check browser console for errors
- Verify Save button was clicked
- Check localStorage in DevTools

### Scheduler Not Starting
- Open browser console
- Look for error messages
- Refresh page
- Check if scheduler logs appear

### Email Not Sending
- Verify email notifications are enabled
- Verify email address is entered
- Check Supabase edge function logs
- Verify Resend API key is configured

---

## 📊 Console Output Examples

### Successful Scheduler Start
```
🚀 Initializing scheduler service...
🚀 Scheduler started
📅 Scheduling jobs: daily at 14:30
📦 Repositories: owner/repo1, owner/repo2
🚀 Projects: project-id-1
⏰ Daily job scheduled in 45 minutes at 2:30 PM
```

### Successful Job Trigger
```
🔔 Daily job triggered at 2:30 PM
🚀 Executing analysis for 2 repositories
✅ Analysis execution completed
```

### Scheduler Restart
```
🔄 Restarting scheduler...
⏹️ Scheduler stopped
🚀 Scheduler started
📅 Scheduling jobs: daily at 15:30
⏰ Daily job scheduled in 30 minutes at 3:30 PM
```

---

## ✅ All Tests Passing?

If all tests pass:
1. System is working correctly
2. Ready for production use
3. Can proceed to Phase 4 (Kestra Integration)

If any tests fail:
1. Check troubleshooting section
2. Review browser console logs
3. Check Supabase dashboard
4. Verify all settings are correct

---

**Test Date**: ___________
**Tester**: ___________
**Result**: ✅ All Pass / ⚠️ Some Issues / ❌ Major Issues
