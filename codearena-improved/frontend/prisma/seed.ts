import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const problems = [
  {
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "Easy",
    tags: ["Arrays", "Hash Map"],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers* such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    constraints: [
      "2 ≤ nums.length ≤ 10⁴",
      "-10⁹ ≤ nums[i] ≤ 10⁹",
      "-10⁹ ≤ target ≤ 10⁹",
      "Only one valid answer exists.",
    ],
    hints: [
      "A brute force approach would be O(n²). Can you do better?",
      "Think about what you need to search for as you iterate. For each number, you need to find target - num.",
      "A hash map lets you check for existence in O(1) time.",
    ],
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]." },
      { input: "nums = [3,3], target = 6", output: "[0,1]", explanation: "" },
    ],
    starterCode: {
      python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Write your solution here\n        pass`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n    }\n};`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}`,
      javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    // Write your solution here\n};`,
    },
    testCases: [
      { input: "[2,7,11,15]\n9", output: "[0,1]", isSample: true },
      { input: "[3,2,4]\n6", output: "[1,2]", isSample: true },
      { input: "[3,3]\n6", output: "[0,1]", isSample: false },
      { input: "[1,2,3,4,5]\n9", output: "[3,4]", isSample: false },
      { input: "[-1,-2,-3,-4,-5]\n-8", output: "[2,4]", isSample: false },
    ],
    order: 1,
    acceptance: 49.2,
  },
  {
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    difficulty: "Medium",
    tags: ["Strings", "Sliding Window", "Hash Map"],
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
    constraints: [
      "0 ≤ s.length ≤ 5 * 10⁴",
      "s consists of English letters, digits, symbols and spaces.",
    ],
    hints: [
      "Use a sliding window approach with two pointers.",
      "A hash map can track the last seen index of each character.",
      "When you see a repeated character, move the left pointer past its last occurrence.",
    ],
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"', output: "3", explanation: 'The answer is "wke", with the length of 3.' },
    ],
    starterCode: {
      python: `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        pass`,
      cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};`,
      java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n}`,
      javascript: `var lengthOfLongestSubstring = function(s) {\n    \n};`,
    },
    testCases: [
      { input: "abcabcbb", output: "3", isSample: true },
      { input: "bbbbb", output: "1", isSample: true },
      { input: "pwwkew", output: "3", isSample: false },
      { input: "", output: "0", isSample: false },
      { input: "au", output: "2", isSample: false },
    ],
    order: 2,
    acceptance: 33.8,
  },
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "Easy",
    tags: ["Stack", "Strings"],
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    constraints: ["1 ≤ s.length ≤ 10⁴", "s consists of parentheses only '()[]{}'"],
    hints: [
      "Use a stack to track opening brackets.",
      "When you see a closing bracket, check if it matches the top of the stack.",
    ],
    examples: [
      { input: 's = "()"', output: "true", explanation: "" },
      { input: 's = "()[]{}"', output: "true", explanation: "" },
      { input: 's = "(]"', output: "false", explanation: "" },
    ],
    starterCode: {
      python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        pass`,
      cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};`,
      java: `class Solution {\n    public boolean isValid(String s) {\n        return false;\n    }\n}`,
      javascript: `var isValid = function(s) {\n    \n};`,
    },
    testCases: [
      { input: "()", output: "true", isSample: true },
      { input: "()[]{}", output: "true", isSample: true },
      { input: "(]", output: "false", isSample: false },
      { input: "([)]", output: "false", isSample: false },
      { input: "{[]}", output: "true", isSample: false },
    ],
    order: 3,
    acceptance: 40.8,
  },
  {
    title: "Maximum Subarray",
    slug: "maximum-subarray",
    difficulty: "Medium",
    tags: ["Arrays", "Dynamic Programming", "Divide and Conquer"],
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return *its sum*.`,
    constraints: ["1 ≤ nums.length ≤ 10⁵", "-10⁴ ≤ nums[i] ≤ 10⁴"],
    hints: [
      "Think about Kadane's Algorithm.",
      "At each position, you decide: extend the current subarray, or start fresh?",
    ],
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: "nums = [1]", output: "1", explanation: "" },
      { input: "nums = [5,4,-1,7,8]", output: "23", explanation: "" },
    ],
    starterCode: {
      python: `class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        pass`,
      cpp: `class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        \n    }\n};`,
      java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        return 0;\n    }\n}`,
      javascript: `var maxSubArray = function(nums) {\n    \n};`,
    },
    testCases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", output: "6", isSample: true },
      { input: "[1]", output: "1", isSample: true },
      { input: "[5,4,-1,7,8]", output: "23", isSample: false },
      { input: "[-1]", output: "-1", isSample: false },
      { input: "[-2,-1]", output: "-1", isSample: false },
    ],
    order: 4,
    acceptance: 49.5,
  },
  {
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    difficulty: "Easy",
    tags: ["Dynamic Programming", "Math", "Memoization"],
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?`,
    constraints: ["1 ≤ n ≤ 45"],
    hints: [
      "Think of it as a Fibonacci-like sequence.",
      "To reach step n, you came from step n-1 (1 step) or step n-2 (2 steps).",
      "ways(n) = ways(n-1) + ways(n-2)",
    ],
    examples: [
      { input: "n = 2", output: "2", explanation: "Two ways: (1 step + 1 step) or (2 steps)" },
      { input: "n = 3", output: "3", explanation: "Three ways: (1+1+1), (1+2), (2+1)" },
    ],
    starterCode: {
      python: `class Solution:\n    def climbStairs(self, n: int) -> int:\n        pass`,
      cpp: `class Solution {\npublic:\n    int climbStairs(int n) {\n        \n    }\n};`,
      java: `class Solution {\n    public int climbStairs(int n) {\n        return 0;\n    }\n}`,
      javascript: `var climbStairs = function(n) {\n    \n};`,
    },
    testCases: [
      { input: "2", output: "2", isSample: true },
      { input: "3", output: "3", isSample: true },
      { input: "1", output: "1", isSample: false },
      { input: "10", output: "89", isSample: false },
      { input: "45", output: "1836311903", isSample: false },
    ],
    order: 5,
    acceptance: 51.2,
  },
  {
    title: "Merge K Sorted Lists",
    slug: "merge-k-sorted-lists",
    difficulty: "Hard",
    tags: ["Linked List", "Divide and Conquer", "Heap", "Merge Sort"],
    description: `You are given an array of \`k\` linked-lists \`lists\`, each linked-list is sorted in ascending order.

*Merge all the linked-lists into one sorted linked-list and return it.*`,
    constraints: ["k == lists.length", "0 ≤ k ≤ 10⁴", "0 ≤ lists[i].length ≤ 500", "-10⁴ ≤ lists[i][j] ≤ 10⁴"],
    hints: [
      "Try a divide and conquer approach: merge pairs of lists, then pairs of merged lists.",
      "A min-heap can efficiently find the smallest current element across all lists.",
    ],
    examples: [
      { input: "lists = [[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,3,4,4,5,6]", explanation: "Merging all three lists." },
      { input: "lists = []", output: "[]", explanation: "" },
    ],
    starterCode: {
      python: `# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:\n        pass`,
      cpp: `class Solution {\npublic:\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n        \n    }\n};`,
      java: `class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        return null;\n    }\n}`,
      javascript: `var mergeKLists = function(lists) {\n    \n};`,
    },
    testCases: [
      { input: "[[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,3,4,4,5,6]", isSample: true },
      { input: "[]", output: "[]", isSample: true },
      { input: "[[]]", output: "[]", isSample: false },
    ],
    order: 6,
    acceptance: 47.1,
  },
  {
    title: "Number of Islands",
    slug: "number-of-islands",
    difficulty: "Medium",
    tags: ["Arrays", "DFS", "BFS", "Graphs", "Union Find"],
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return *the number of islands*.

An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.`,
    constraints: ["m == grid.length", "n == grid[i].length", "1 ≤ m, n ≤ 300", "grid[i][j] is '0' or '1'."],
    hints: [
      "Think about DFS/BFS: when you find a '1', explore all connected land cells.",
      "Mark visited cells to avoid counting the same island twice.",
    ],
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: "1", explanation: "" },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: "3", explanation: "" },
    ],
    starterCode: {
      python: `class Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        pass`,
      cpp: `class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        \n    }\n};`,
      java: `class Solution {\n    public int numIslands(char[][] grid) {\n        return 0;\n    }\n}`,
      javascript: `var numIslands = function(grid) {\n    \n};`,
    },
    testCases: [
      { input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: "1", isSample: true },
      { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: "3", isSample: true },
    ],
    order: 7,
    acceptance: 55.4,
  },
  {
    title: "Coin Change",
    slug: "coin-change",
    difficulty: "Medium",
    tags: ["Dynamic Programming", "BFS"],
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return *the fewest number of coins that you need to make up that amount*. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
    constraints: ["1 ≤ coins.length ≤ 12", "1 ≤ coins[i] ≤ 2³¹ - 1", "0 ≤ amount ≤ 10⁴"],
    hints: [
      "Classic DP: dp[i] = minimum coins to make amount i.",
      "For each amount, try every coin denomination.",
      "dp[i] = min(dp[i], dp[i - coin] + 1) for each coin ≤ i.",
    ],
    examples: [
      { input: "coins = [1,5,10,25], amount = 30", output: "2", explanation: "25 + 5 = 30, using 2 coins." },
      { input: "coins = [2], amount = 3", output: "-1", explanation: "Cannot make 3 with only 2-denomination coins." },
      { input: "coins = [1], amount = 0", output: "0", explanation: "Zero coins needed for amount 0." },
    ],
    starterCode: {
      python: `class Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        pass`,
      cpp: `class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        \n    }\n};`,
      java: `class Solution {\n    public int coinChange(int[] coins, int amount) {\n        return 0;\n    }\n}`,
      javascript: `var coinChange = function(coins, amount) {\n    \n};`,
    },
    testCases: [
      { input: "[1,5,10,25]\n30", output: "2", isSample: true },
      { input: "[2]\n3", output: "-1", isSample: true },
      { input: "[1]\n0", output: "0", isSample: false },
      { input: "[1,2,5]\n11", output: "3", isSample: false },
      { input: "[186,419,83,408]\n6249", output: "20", isSample: false },
    ],
    order: 8,
    acceptance: 41.5,
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  for (const problem of problems) {
    await prisma.problem.upsert({
      where: { slug: problem.slug },
      update: problem,
      create: problem,
    });
    console.log(`  ✓ ${problem.title}`);
  }

  console.log(`\n✅ Seeded ${problems.length} problems successfully!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
