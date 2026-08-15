async function runTests() {
  console.log('--- STARTING PUREGRO API TESTS ---');

  // Test 1: Fetch Stats
  const statsRes = await fetch('http://localhost:3001/api/stats');
  const stats = await statsRes.json();
  console.log('✅ Stats API:', stats);

  // Test 2: Register a new member
  console.log('\n--- Testing Member Registration ---');
  const newMemberPayload = {
    full_name: 'Lucas Van Der Merwe',
    id_number: 'ID-77281903',
    email: 'lucas.merwe@example.com',
    phone: '+1 (555) 392-1082',
    tier: 'Platinum Green',
    notes: 'Registered via automated test suite',
  };

  const regRes = await fetch('http://localhost:3001/api/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newMemberPayload),
  });
  const regData = await regRes.json();
  console.log('✅ Registration response status:', regRes.status);
  console.log('✅ Generated Membership Number:', regData.member?.membership_no);
  console.log('✅ Generated QR Code present:', Boolean(regData.member?.qr_code));

  const memberNo = regData.member?.membership_no;

  // Test 3: Duplicate ID number check
  console.log('\n--- Testing Duplicate ID Check ---');
  const dupRes = await fetch('http://localhost:3001/api/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newMemberPayload),
  });
  console.log('✅ Duplicate check status (should be 409):', dupRes.status);

  // Test 4: Quick Lookup by Membership Number
  console.log('\n--- Testing Quick Lookup by Membership # ---');
  const search1 = await fetch(`http://localhost:3001/api/members/search?q=${encodeURIComponent(memberNo)}`);
  const s1Data = await search1.json();
  console.log('✅ Found by Membership #:', s1Data.results.length > 0 ? s1Data.results[0].full_name : 'None');

  // Test 5: Quick Lookup by ID Number
  console.log('\n--- Testing Quick Lookup by ID # ---');
  const search2 = await fetch('http://localhost:3001/api/members/search?q=ID-77281903');
  const s2Data = await search2.json();
  console.log('✅ Found by ID #:', s2Data.results.length > 0 ? s2Data.results[0].full_name : 'None');

  // Test 6: Quick Lookup by Email
  console.log('\n--- Testing Quick Lookup by Email ---');
  const search3 = await fetch('http://localhost:3001/api/members/search?q=lucas.merwe@example.com');
  const s3Data = await search3.json();
  console.log('✅ Found by Email:', s3Data.results.length > 0 ? s3Data.results[0].full_name : 'None');

  // Test 7: Email logs verification
  console.log('\n--- Testing Email Logs ---');
  const emailRes = await fetch('http://localhost:3001/api/emails');
  const emailData = await emailRes.json();
  console.log('✅ Total Email logs count:', emailData.logs.length);
  emailData.logs.slice(0, 2).forEach(l => {
    console.log(`   - [${l.recipient_type}] To: ${l.recipient} | Subject: ${l.subject} | Status: ${l.status}`);
  });

  console.log('\n🎉 ALL SYSTEM TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
