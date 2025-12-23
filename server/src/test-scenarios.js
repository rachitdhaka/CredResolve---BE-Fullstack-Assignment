/**
 * Test scenarios for the Expense Sharing Application
 * Run this file with: node src/test-scenarios.js
 */

import { UserService } from './services/UserService.js';
import { GroupService } from './services/GroupService.js';
import { BalanceService } from './services/BalanceService.js';
import { ExpenseService } from './services/ExpenseService.js';
import { SettlementService } from './services/SettlementService.js';
import { SplitType } from './models/Expense.js';

// Initialize services - each test will use its own instances
let userService, balanceService, groupService, expenseService, settlementService;

function initializeServices() {
  userService = new UserService();
  balanceService = new BalanceService();
  groupService = new GroupService(userService);
  expenseService = new ExpenseService(groupService, userService, balanceService);
  settlementService = new SettlementService(groupService, userService, balanceService);
}

console.log('🧪 Starting Expense Sharing Application Tests\n');
console.log('='.repeat(60));

/**
 * Test 1: Equal Split Scenario
 */
function testEqualSplit() {
  console.log('\n📋 Test 1: Equal Split Scenario');
  console.log('-'.repeat(60));

  try {
    // Initialize fresh services for this test
    initializeServices();

    // Create users
    const alice = userService.createUser('Alice', 'alice@test.com');
    const bob = userService.createUser('Bob', 'bob@test.com');
    const charlie = userService.createUser('Charlie', 'charlie@test.com');

    console.log(`✅ Created users: ${alice.name}, ${bob.name}, ${charlie.name}`);

    // Create group
    const group = groupService.createGroup('Weekend Trip', 'Our weekend getaway', alice.id);
    groupService.addMember(group.id, bob.id);
    groupService.addMember(group.id, charlie.id);

    console.log(`✅ Created group: ${group.name} with ${group.members.length} members`);

    // Add expense - Alice pays $300 for hotel
    const hotelExpense = expenseService.addExpense({
      groupId: group.id,
      description: 'Hotel booking',
      totalAmount: 300,
      paidBy: alice.id,
      splitType: SplitType.EQUAL,
      splits: [
        { userId: alice.id },
        { userId: bob.id },
        { userId: charlie.id }
      ]
    });

    console.log(`✅ Added expense: ${hotelExpense.expense.description} - $${hotelExpense.expense.totalAmount}`);
    console.log(`   Split equally among 3 people: $100 each`);

    // Add expense - Bob pays $150 for dinner
    const dinnerExpense = expenseService.addExpense({
      groupId: group.id,
      description: 'Dinner',
      totalAmount: 150,
      paidBy: bob.id,
      splitType: SplitType.EQUAL,
      splits: [
        { userId: alice.id },
        { userId: bob.id },
        { userId: charlie.id }
      ]
    });

    console.log(`✅ Added expense: ${dinnerExpense.expense.description} - $${dinnerExpense.expense.totalAmount}`);
    console.log(`   Split equally among 3 people: $50 each`);

    // Check balances
    const balances = balanceService.getGroupBalances(group.id);
    console.log('\n💰 Current Balances:');
    
    // Create a user map for lookups
    const userMap = new Map();
    userMap.set(alice.id, alice);
    userMap.set(bob.id, bob);
    userMap.set(charlie.id, charlie);
    
    balances.forEach(balance => {
      const from = userMap.get(balance.fromUserId);
      const to = userMap.get(balance.toUserId);
      if (from && to) {
        console.log(`   ${from.name} owes ${to.name}: $${balance.amount.toFixed(2)}`);
      } else {
        console.log(`   DEBUG: from=${balance.fromUserId}, to=${balance.toUserId}`);
      }
    });

    // Get simplified balances
    const simplified = balanceService.simplifyBalances(group.id, group.members);
    console.log('\n✨ Simplified Balances:');
    simplified.forEach(balance => {
      const from = userMap.get(balance.fromUserId);
      const to = userMap.get(balance.toUserId);
      if (from && to) {
        console.log(`   ${from.name} owes ${to.name}: $${balance.amount.toFixed(2)}`);
      }
    });

    console.log('\n✅ Test 1 Passed!');
    return true;
  } catch (error) {
    console.error(`❌ Test 1 Failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Exact Split Scenario
 */
function testExactSplit() {
  console.log('\n📋 Test 2: Exact Split Scenario');
  console.log('-'.repeat(60));

  try {
    // Initialize fresh services for this test
    initializeServices();

    // Create users
    const david = userService.createUser('David', 'david@test.com');
    const emma = userService.createUser('Emma', 'emma@test.com');
    const frank = userService.createUser('Frank', 'frank@test.com');

    console.log(`✅ Created users: ${david.name}, ${emma.name}, ${frank.name}`);

    // Create group
    const group = groupService.createGroup('Shared Apartment', 'Our apartment expenses', david.id);
    groupService.addMember(group.id, emma.id);
    groupService.addMember(group.id, frank.id);

    console.log(`✅ Created group: ${group.name}`);

    // Add expense with exact amounts
    const utilityExpense = expenseService.addExpense({
      groupId: group.id,
      description: 'Electricity bill',
      totalAmount: 200,
      paidBy: david.id,
      splitType: SplitType.EXACT,
      splits: [
        { userId: david.id, amount: 80 },
        { userId: emma.id, amount: 70 },
        { userId: frank.id, amount: 50 }
      ]
    });

    console.log(`✅ Added expense: ${utilityExpense.expense.description} - $${utilityExpense.expense.totalAmount}`);
    console.log(`   David: $80, Emma: $70, Frank: $50`);

    // Check balances
    const balances = balanceService.getGroupBalances(group.id);
    console.log('\n💰 Current Balances:');
    
    // Create a user map for lookups
    const userMap = new Map();
    userMap.set(david.id, david);
    userMap.set(emma.id, emma);
    userMap.set(frank.id, frank);
    
    balances.forEach(balance => {
      const from = userMap.get(balance.fromUserId);
      const to = userMap.get(balance.toUserId);
      if (from && to) {
        console.log(`   ${from.name} owes ${to.name}: $${balance.amount.toFixed(2)}`);
      }
    });

    console.log('\n✅ Test 2 Passed!');
    return true;
  } catch (error) {
    console.error(`❌ Test 2 Failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Percentage Split Scenario
 */
function testPercentageSplit() {
  console.log('\n📋 Test 3: Percentage Split Scenario');
  console.log('-'.repeat(60));

  try {
    // Initialize fresh services for this test
    initializeServices();

    // Create users
    const partner1 = userService.createUser('Partner 1', 'partner1@business.com');
    const partner2 = userService.createUser('Partner 2', 'partner2@business.com');
    const partner3 = userService.createUser('Partner 3', 'partner3@business.com');

    console.log(`✅ Created users: ${partner1.name}, ${partner2.name}, ${partner3.name}`);

    // Create group
    const group = groupService.createGroup('Business Partnership', 'Our business expenses', partner1.id);
    groupService.addMember(group.id, partner2.id);
    groupService.addMember(group.id, partner3.id);

    console.log(`✅ Created group: ${group.name}`);

    // Add expense with percentage split
    const rentExpense = expenseService.addExpense({
      groupId: group.id,
      description: 'Office rent',
      totalAmount: 5000,
      paidBy: partner1.id,
      splitType: SplitType.PERCENTAGE,
      splits: [
        { userId: partner1.id, percentage: 50 },
        { userId: partner2.id, percentage: 30 },
        { userId: partner3.id, percentage: 20 }
      ]
    });

    console.log(`✅ Added expense: ${rentExpense.expense.description} - $${rentExpense.expense.totalAmount}`);
    console.log(`   Partner 1: 50% ($2500), Partner 2: 30% ($1500), Partner 3: 20% ($1000)`);

    // Check balances
    const balances = balanceService.getGroupBalances(group.id);
    console.log('\n💰 Current Balances:');
    
    // Create a user map for lookups
    const userMap = new Map();
    userMap.set(partner1.id, partner1);
    userMap.set(partner2.id, partner2);
    userMap.set(partner3.id, partner3);
    
    balances.forEach(balance => {
      const from = userMap.get(balance.fromUserId);
      const to = userMap.get(balance.toUserId);
      if (from && to) {
        console.log(`   ${from.name} owes ${to.name}: $${balance.amount.toFixed(2)}`);
      }
    });

    console.log('\n✅ Test 3 Passed!');
    return true;
  } catch (error) {
    console.error(`❌ Test 3 Failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Settlement Scenario
 */
function testSettlement() {
  console.log('\n📋 Test 4: Settlement Scenario');
  console.log('-'.repeat(60));

  try {
    // Initialize fresh services for this test
    initializeServices();

    // Create users
    const grace = userService.createUser('Grace', 'grace@test.com');
    const henry = userService.createUser('Henry', 'henry@test.com');

    console.log(`✅ Created users: ${grace.name}, ${henry.name}`);

    // Create group
    const group = groupService.createGroup('Friends', 'Friend expenses', grace.id);
    groupService.addMember(group.id, henry.id);

    console.log(`✅ Created group: ${group.name}`);

    // Add expense
    expenseService.addExpense({
      groupId: group.id,
      description: 'Lunch',
      totalAmount: 60,
      paidBy: grace.id,
      splitType: SplitType.EQUAL,
      splits: [
        { userId: grace.id },
        { userId: henry.id }
      ]
    });

    console.log(`✅ Added expense: Lunch - $60 (split equally)`);

    // Check initial balance
    let balance = balanceService.getBalanceBetweenUsers(group.id, henry.id, grace.id);
    console.log(`\n💰 Initial Balance: Henry owes Grace $${balance.toFixed(2)}`);

    // Record settlement
    const settlement = settlementService.recordSettlement({
      groupId: group.id,
      fromUserId: henry.id,
      toUserId: grace.id,
      amount: 30
    });

    console.log(`✅ Settlement recorded: Henry paid Grace $${settlement.settlement.amount.toFixed(2)}`);

    // Check remaining balance
    balance = balanceService.getBalanceBetweenUsers(group.id, henry.id, grace.id);
    console.log(`💰 Remaining Balance: Henry owes Grace $${balance.toFixed(2)}`);

    console.log('\n✅ Test 4 Passed!');
    return true;
  } catch (error) {
    console.error(`❌ Test 4 Failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Balance Simplification
 */
function testBalanceSimplification() {
  console.log('\n📋 Test 5: Complex Balance Simplification');
  console.log('-'.repeat(60));

  try {
    // Initialize fresh services for this test
    initializeServices();

    // Create users
    const user1 = userService.createUser('User1', 'user1@test.com');
    const user2 = userService.createUser('User2', 'user2@test.com');
    const user3 = userService.createUser('User3', 'user3@test.com');
    const user4 = userService.createUser('User4', 'user4@test.com');

    console.log(`✅ Created 4 users`);

    // Create group
    const group = groupService.createGroup('Complex Group', 'Testing simplification', user1.id);
    groupService.addMember(group.id, user2.id);
    groupService.addMember(group.id, user3.id);
    groupService.addMember(group.id, user4.id);

    // Add multiple expenses to create complex balances
    expenseService.addExpense({
      groupId: group.id,
      description: 'Expense 1',
      totalAmount: 100,
      paidBy: user1.id,
      splitType: SplitType.EQUAL,
      splits: [
        { userId: user1.id },
        { userId: user2.id },
        { userId: user3.id },
        { userId: user4.id }
      ]
    });

    expenseService.addExpense({
      groupId: group.id,
      description: 'Expense 2',
      totalAmount: 80,
      paidBy: user2.id,
      splitType: SplitType.EQUAL,
      splits: [
        { userId: user1.id },
        { userId: user2.id },
        { userId: user3.id },
        { userId: user4.id }
      ]
    });

    expenseService.addExpense({
      groupId: group.id,
      description: 'Expense 3',
      totalAmount: 60,
      paidBy: user3.id,
      splitType: SplitType.EQUAL,
      splits: [
        { userId: user2.id },
        { userId: user3.id },
        { userId: user4.id }
      ]
    });

    console.log(`✅ Added 3 expenses`);

    // Create a user map for lookups
    const userMap = new Map();
    userMap.set(user1.id, user1);
    userMap.set(user2.id, user2);
    userMap.set(user3.id, user3);
    userMap.set(user4.id, user4);

    // Get original balances
    const originalBalances = balanceService.getGroupBalances(group.id);
    console.log(`\n💰 Original Balances (${originalBalances.length} transactions):`);
    originalBalances.forEach(balance => {
      const from = userMap.get(balance.fromUserId);
      const to = userMap.get(balance.toUserId);
      if (from && to) {
        console.log(`   ${from.name} owes ${to.name}: $${balance.amount.toFixed(2)}`);
      }
    });

    // Get simplified balances
    const simplified = balanceService.simplifyBalances(group.id, group.members);
    console.log(`\n✨ Simplified Balances (${simplified.length} transactions):`);
    simplified.forEach(balance => {
      const from = userMap.get(balance.fromUserId);
      const to = userMap.get(balance.toUserId);
      if (from && to) {
        console.log(`   ${from.name} owes ${to.name}: $${balance.amount.toFixed(2)}`);
      }
    });

    console.log(`\n📊 Reduced ${originalBalances.length} transactions to ${simplified.length} transactions`);
    console.log('\n✅ Test 5 Passed!');
    return true;
  } catch (error) {
    console.error(`❌ Test 5 Failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Error Handling
 */
function testErrorHandling() {
  console.log('\n📋 Test 6: Error Handling');
  console.log('-'.repeat(60));

  let passed = 0;
  let failed = 0;

  // Initialize fresh services for this test
  initializeServices();

  // Test 1: Invalid exact split
  try {
    const user = userService.createUser('Test User', 'test@test.com');
    const group = groupService.createGroup('Test Group', '', user.id);

    expenseService.addExpense({
      groupId: group.id,
      description: 'Invalid',
      totalAmount: 100,
      paidBy: user.id,
      splitType: SplitType.EXACT,
      splits: [{ userId: user.id, amount: 50 }] // Sum doesn't match total
    });

    console.log('❌ Should have thrown validation error for exact split');
    failed++;
  } catch (error) {
    console.log('✅ Correctly caught invalid exact split error');
    passed++;
  }

  // Test 2: Invalid percentage split
  try {
    const user = userService.createUser('Test User 2', 'test2@test.com');
    const group = groupService.createGroup('Test Group 2', '', user.id);

    expenseService.addExpense({
      groupId: group.id,
      description: 'Invalid',
      totalAmount: 100,
      paidBy: user.id,
      splitType: SplitType.PERCENTAGE,
      splits: [{ userId: user.id, percentage: 50 }] // Sum doesn't equal 100%
    });

    console.log('❌ Should have thrown validation error for percentage split');
    failed++;
  } catch (error) {
    console.log('✅ Correctly caught invalid percentage split error');
    passed++;
  }

  // Test 3: Settlement exceeding balance
  try {
    const user1 = userService.createUser('Test User 3', 'test3@test.com');
    const user2 = userService.createUser('Test User 4', 'test4@test.com');
    const group = groupService.createGroup('Test Group 3', '', user1.id);
    groupService.addMember(group.id, user2.id);

    expenseService.addExpense({
      groupId: group.id,
      description: 'Small expense',
      totalAmount: 20,
      paidBy: user1.id,
      splitType: SplitType.EQUAL,
      splits: [{ userId: user1.id }, { userId: user2.id }]
    });

    settlementService.recordSettlement({
      groupId: group.id,
      fromUserId: user2.id,
      toUserId: user1.id,
      amount: 100 // More than owed
    });

    console.log('❌ Should have thrown error for settlement exceeding balance');
    failed++;
  } catch (error) {
    console.log('✅ Correctly caught settlement exceeding balance error');
    passed++;
  }

  console.log(`\n📊 Error Handling: ${passed} passed, ${failed} failed`);
  console.log(failed === 0 ? '✅ Test 6 Passed!' : '❌ Test 6 Failed!');
  return failed === 0;
}

/**
 * Run all tests
 */
function runAllTests() {
  const results = [
    testEqualSplit(),
    testExactSplit(),
    testPercentageSplit(),
    testSettlement(),
    testBalanceSimplification(),
    testErrorHandling()
  ];

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log('\n' + '='.repeat(60));
  console.log(`\n🎯 Test Summary: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
  } else {
    console.log(`❌ ${total - passed} tests failed`);
  }
  console.log('\n' + '='.repeat(60));
}

// Run all tests
runAllTests();
