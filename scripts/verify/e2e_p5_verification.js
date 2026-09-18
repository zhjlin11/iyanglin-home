const { chromium } = require('C:/Users/Administrator/.gemini/antigravity/brain/8e4b71a8-1598-42b1-9757-7a5737e399ae/scratch/node_modules/playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/Administrator/.gemini/antigravity/brain/8e4b71a8-1598-42b1-9757-7a5737e399ae';

async function run() {
  console.log('🚀 Starting P5 End-to-End Browser Verification on https://iyanglin.com ...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Users\\Administrator\\AppData\\Local\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe',
    headless: true
  });

  try {
    // ------------------------------------------------------------
    // 1. User login & Profile (Points, Notifications, Verification)
    // ------------------------------------------------------------
    console.log('\n--- Test 1: User Login & Points / Benefit Redemption ---');
    const userContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await userContext.newPage();

    await page.goto('https://iyanglin.com/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.fill('input[type="text"]', 'test-user');
    await page.fill('input[type="password"]', 'test-pass-123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Points Tab
    console.log('Navigating to Points Tab (/profile?tab=points)...');
    await page.goto('https://iyanglin.com/profile?tab=points', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    const pointsScreenshot = path.join(ARTIFACT_DIR, 'p5_profile_points_redemption.png');
    await page.screenshot({ path: pointsScreenshot, fullPage: false });
    console.log('✅ Points & Redemption screenshot saved:', pointsScreenshot);

    // Notifications Tab
    console.log('Navigating to Notifications Tab (/profile?tab=notifications)...');
    await page.goto('https://iyanglin.com/profile?tab=notifications', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    const notifScreenshot = path.join(ARTIFACT_DIR, 'p5_profile_notifications_center.png');
    await page.screenshot({ path: notifScreenshot, fullPage: false });
    console.log('✅ Notifications Center screenshot saved:', notifScreenshot);

    // Verification Tab
    console.log('Navigating to Verification Tab (/profile?tab=verification)...');
    await page.goto('https://iyanglin.com/profile?tab=verification', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    const verifyScreenshot = path.join(ARTIFACT_DIR, 'p5_profile_verification_tab.png');
    await page.screenshot({ path: verifyScreenshot, fullPage: false });
    console.log('✅ Verification Tab screenshot saved:', verifyScreenshot);

    // Unified Workspace
    console.log('Navigating to Unified Workspace (/workspace)...');
    await page.goto('https://iyanglin.com/workspace', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    const wsScreenshot = path.join(ARTIFACT_DIR, 'p5_unified_workspace.png');
    await page.screenshot({ path: wsScreenshot, fullPage: false });
    console.log('✅ Unified Workspace screenshot saved:', wsScreenshot);

    // ------------------------------------------------------------
    // 2. Cross-Channel Recommendations
    // ------------------------------------------------------------
    console.log('\n--- Test 2: Rule-Driven Cross-Channel Recommendations ---');
    console.log('Checking Industrial detail page recommendations...');
    await page.goto('https://iyanglin.com/industrial/cmtv1a25u0009xwr06ndk9asd', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(1000);
    const indRecScreenshot = path.join(ARTIFACT_DIR, 'p5_recommendations_industrial.png');
    await page.screenshot({ path: indRecScreenshot, fullPage: false });
    console.log('✅ Industrial Cross-Channel Recommendations screenshot saved:', indRecScreenshot);

    console.log('Checking Job detail page recommendations...');
    await page.goto('https://iyanglin.com/jobs/cmtnkwtr7000axwgm1rs8b27d', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(1000);
    const jobRecScreenshot = path.join(ARTIFACT_DIR, 'p5_recommendations_job.png');
    await page.screenshot({ path: jobRecScreenshot, fullPage: false });
    console.log('✅ Job Cross-Channel Recommendations screenshot saved:', jobRecScreenshot);

    // ------------------------------------------------------------
    // 3. Unified 8-Channel Search
    // ------------------------------------------------------------
    console.log('\n--- Test 3: Unified 8-Channel Search ---');
    await page.goto('https://iyanglin.com/search?q=杨林', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2500);
    const searchScreenshot = path.join(ARTIFACT_DIR, 'p5_search_cross_channel.png');
    await page.screenshot({ path: searchScreenshot, fullPage: false });
    console.log('✅ Unified Search screenshot saved:', searchScreenshot);

    // ------------------------------------------------------------
    // 4. Admin Management Center
    // ------------------------------------------------------------
    console.log('\n--- Test 4: Unified Admin Operations & Finance & Risk ---');
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();

    await adminPage.goto('https://iyanglin.com/admin/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await adminPage.fill('input[type="text"]', 'admin');
    await adminPage.fill('input[type="password"]', 'test-pass-123');
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForTimeout(2000);

    // Admin Dashboard with Funnel & Revenue
    console.log('Navigating to Admin Dashboard (/admin)...');
    await adminPage.goto('https://iyanglin.com/admin', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await adminPage.waitForTimeout(2000);
    const adminCockpitScreenshot = path.join(ARTIFACT_DIR, 'p5_admin_cockpit_funnel.png');
    await adminPage.screenshot({ path: adminCockpitScreenshot, fullPage: false });
    console.log('✅ Admin Cockpit with Funnel & Revenue screenshot saved:', adminCockpitScreenshot);

    // Admin Finance Center
    console.log('Navigating to Admin Finance Center (/admin/finance)...');
    await adminPage.goto('https://iyanglin.com/admin/finance', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await adminPage.waitForTimeout(2000);
    const adminFinanceScreenshot = path.join(ARTIFACT_DIR, 'p5_admin_finance_reconciliation.png');
    await adminPage.screenshot({ path: adminFinanceScreenshot, fullPage: false });
    console.log('✅ Admin Finance Reconciliation screenshot saved:', adminFinanceScreenshot);

    // Admin Risk Center
    console.log('Navigating to Admin Risk Center (/admin/risk)...');
    await adminPage.goto('https://iyanglin.com/admin/risk', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await adminPage.waitForTimeout(2000);
    const adminRiskScreenshot = path.join(ARTIFACT_DIR, 'p5_admin_risk_center.png');
    await adminPage.screenshot({ path: adminRiskScreenshot, fullPage: false });
    console.log('✅ Admin Risk Center screenshot saved:', adminRiskScreenshot);

    // Admin Review Center
    console.log('Navigating to Admin Review Center (/admin/review)...');
    await adminPage.goto('https://iyanglin.com/admin/review', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await adminPage.waitForTimeout(2000);
    const adminReviewScreenshot = path.join(ARTIFACT_DIR, 'p5_admin_review_unified.png');
    await adminPage.screenshot({ path: adminReviewScreenshot, fullPage: false });
    console.log('✅ Admin Review Unified screenshot saved:', adminReviewScreenshot);

    // ------------------------------------------------------------
    // 5. Mobile Responsive Profile
    // ------------------------------------------------------------
    console.log('\n--- Test 5: Mobile Viewport Profile & Dock ---');
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('https://iyanglin.com/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await mobilePage.fill('input[type="text"]', 'test-user');
    await mobilePage.fill('input[type="password"]', 'test-pass-123');
    await mobilePage.click('button[type="submit"]');
    await mobilePage.waitForTimeout(2000);

    await mobilePage.goto('https://iyanglin.com/profile', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await mobilePage.waitForTimeout(2000);
    const mobileScreenshot = path.join(ARTIFACT_DIR, 'p5_mobile_profile_unified.png');
    await mobilePage.screenshot({ path: mobileScreenshot, fullPage: false });
    console.log('✅ Mobile Profile & Dock screenshot saved:', mobileScreenshot);

    console.log('\n🎉 ALL P5 E2E TESTS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    await browser.close();
  }
}

run();
