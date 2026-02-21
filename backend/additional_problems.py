# Additional problems to seed into the database
# This file contains 45+ problems covering various topics

ADDITIONAL_PROBLEMS = [
    {
        "title": "Reverse String",
        "description": """Write a function that reverses a string in-place.

**Input Format:**
- A single string

**Output Format:**
- The reversed string

**Example:**
```
Input: hello
Output: olleh
```""",
        "difficulty": "easy",
        "tags": ["string", "two-pointers"],
        "sample_input": "hello",
        "sample_output": "olleh",
        "test_cases": [
            {"input": "hello", "output": "olleh"},
            {"input": "world", "output": "dlrow"},
            {"input": "a", "output": "a"}
        ],
        "hints": ["Use two pointers from start and end", "Swap characters as you go"],
        "constraints": "1 <= len(s) <= 10^5",
        "time_limit": 5
    },
    {
        "title": "Contains Duplicate",
        "description": """Given an integer array, return true if any value appears at least twice.

**Input Format:**
- Space-separated integers

**Output Format:**
- True or False

**Example:**
```
Input: 1 2 3 1
Output: True
```""",
        "difficulty": "easy",
        "tags": ["array", "hash-table"],
        "sample_input": "1 2 3 1",
        "sample_output": "True",
        "test_cases": [
            {"input": "1 2 3 1", "output": "True"},
            {"input": "1 2 3 4", "output": "False"},
            {"input": "1 1 1 3 3 4 3 2 4 2", "output": "True"}
        ],
        "hints": ["Use a set to track seen numbers", "Check if number already in set before adding"],
        "constraints": "1 <= len(nums) <= 10^5",
        "time_limit": 5
    },
    {
        "title": "Single Number",
        "description": """Given a non-empty array where every element appears twice except one, find that single one.

**Input Format:**
- Space-separated integers

**Output Format:**
- The single number

**Example:**
```
Input: 4 1 2 1 2
Output: 4
```""",
        "difficulty": "easy",
        "tags": ["array", "bit-manipulation"],
        "sample_input": "4 1 2 1 2",
        "sample_output": "4",
        "test_cases": [
            {"input": "4 1 2 1 2", "output": "4"},
            {"input": "2 2 1", "output": "1"},
            {"input": "1", "output": "1"}
        ],
        "hints": ["XOR of a number with itself is 0", "XOR of a number with 0 is the number itself"],
        "constraints": "1 <= len(nums) <= 3*10^4",
        "time_limit": 5
    },
    {
        "title": "Best Time to Buy and Sell Stock",
        "description": """Given prices where prices[i] is the price on day i, maximize profit from one buy and one sell.

**Input Format:**
- Space-separated integers (prices)

**Output Format:**
- Maximum profit (0 if no profit possible)

**Example:**
```
Input: 7 1 5 3 6 4
Output: 5
```
Buy on day 2 (price=1) and sell on day 5 (price=6), profit = 6-1 = 5.""",
        "difficulty": "easy",
        "tags": ["array", "dynamic-programming"],
        "sample_input": "7 1 5 3 6 4",
        "sample_output": "5",
        "test_cases": [
            {"input": "7 1 5 3 6 4", "output": "5"},
            {"input": "7 6 4 3 1", "output": "0"},
            {"input": "1 2", "output": "1"}
        ],
        "hints": ["Track minimum price seen so far", "Calculate potential profit at each step"],
        "constraints": "1 <= len(prices) <= 10^5",
        "time_limit": 5
    },
    {
        "title": "Merge Two Sorted Lists",
        "description": """Merge two sorted lists into one sorted list.

**Input Format:**
- Line 1: First sorted list (space-separated)
- Line 2: Second sorted list (space-separated)

**Output Format:**
- Merged sorted list (space-separated)

**Example:**
```
Input:
1 2 4
1 3 4

Output:
1 1 2 3 4 4
```""",
        "difficulty": "easy",
        "tags": ["linked-list", "two-pointers"],
        "sample_input": "1 2 4\n1 3 4",
        "sample_output": "1 1 2 3 4 4",
        "test_cases": [
            {"input": "1 2 4\n1 3 4", "output": "1 1 2 3 4 4"},
            {"input": "\n0", "output": "0"},
            {"input": "\n", "output": ""}
        ],
        "hints": ["Use two pointers, one for each list", "Compare and append smaller element"],
        "constraints": "0 <= len(list) <= 50",
        "time_limit": 5
    },
    {
        "title": "Climbing Stairs",
        "description": """You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. Count distinct ways to reach the top.

**Input Format:**
- A single integer n

**Output Format:**
- Number of distinct ways

**Example:**
```
Input: 3
Output: 3
```
(1+1+1), (1+2), (2+1)""",
        "difficulty": "easy",
        "tags": ["dynamic-programming", "math"],
        "sample_input": "3",
        "sample_output": "3",
        "test_cases": [
            {"input": "2", "output": "2"},
            {"input": "3", "output": "3"},
            {"input": "4", "output": "5"}
        ],
        "hints": ["This is similar to Fibonacci", "dp[i] = dp[i-1] + dp[i-2]"],
        "constraints": "1 <= n <= 45",
        "time_limit": 5
    },
    {
        "title": "Binary Search",
        "description": """Given a sorted array and target, return its index or -1 if not found.

**Input Format:**
- Line 1: Space-separated sorted integers
- Line 2: Target integer

**Output Format:**
- Index of target or -1

**Example:**
```
Input:
-1 0 3 5 9 12
9

Output:
4
```""",
        "difficulty": "easy",
        "tags": ["binary-search", "array"],
        "sample_input": "-1 0 3 5 9 12\n9",
        "sample_output": "4",
        "test_cases": [
            {"input": "-1 0 3 5 9 12\n9", "output": "4"},
            {"input": "-1 0 3 5 9 12\n2", "output": "-1"},
            {"input": "5\n5", "output": "0"}
        ],
        "hints": ["Use left and right pointers", "Compare mid with target"],
        "constraints": "1 <= len(nums) <= 10^4",
        "time_limit": 5
    },
    {
        "title": "Reverse Linked List",
        "description": """Given a linked list represented as space-separated values, reverse it.

**Input Format:**
- Space-separated integers (linked list values)

**Output Format:**
- Reversed list (space-separated)

**Example:**
```
Input: 1 2 3 4 5
Output: 5 4 3 2 1
```""",
        "difficulty": "easy",
        "tags": ["linked-list", "recursion"],
        "sample_input": "1 2 3 4 5",
        "sample_output": "5 4 3 2 1",
        "test_cases": [
            {"input": "1 2 3 4 5", "output": "5 4 3 2 1"},
            {"input": "1 2", "output": "2 1"},
            {"input": "1", "output": "1"}
        ],
        "hints": ["Track previous, current, and next pointers", "Reverse the links as you traverse"],
        "constraints": "0 <= len(list) <= 5000",
        "time_limit": 5
    },
    {
        "title": "3Sum",
        "description": """Given an array, find all unique triplets that sum to zero.

**Input Format:**
- Space-separated integers

**Output Format:**
- Each triplet on a new line (sorted, space-separated)

**Example:**
```
Input: -1 0 1 2 -1 -4
Output:
-1 -1 2
-1 0 1
```""",
        "difficulty": "medium",
        "tags": ["array", "two-pointers", "sorting"],
        "sample_input": "-1 0 1 2 -1 -4",
        "sample_output": "-1 -1 2\n-1 0 1",
        "test_cases": [
            {"input": "-1 0 1 2 -1 -4", "output": "-1 -1 2\n-1 0 1"},
            {"input": "0 1 1", "output": ""},
            {"input": "0 0 0", "output": "0 0 0"}
        ],
        "hints": ["Sort the array first", "Fix one number and use two pointers for the rest"],
        "constraints": "3 <= len(nums) <= 3000",
        "time_limit": 5
    },
    {
        "title": "Container With Most Water",
        "description": """Given heights, find two lines that together with x-axis forms a container with most water.

**Input Format:**
- Space-separated integers (heights)

**Output Format:**
- Maximum area

**Example:**
```
Input: 1 8 6 2 5 4 8 3 7
Output: 49
```""",
        "difficulty": "medium",
        "tags": ["array", "two-pointers", "greedy"],
        "sample_input": "1 8 6 2 5 4 8 3 7",
        "sample_output": "49",
        "test_cases": [
            {"input": "1 8 6 2 5 4 8 3 7", "output": "49"},
            {"input": "1 1", "output": "1"},
            {"input": "4 3 2 1 4", "output": "16"}
        ],
        "hints": ["Use two pointers from both ends", "Move the pointer with smaller height"],
        "constraints": "2 <= len(height) <= 10^5",
        "time_limit": 5
    },
    {
        "title": "Longest Substring Without Repeating Characters",
        "description": """Find the length of the longest substring without repeating characters.

**Input Format:**
- A single string

**Output Format:**
- Length of longest substring

**Example:**
```
Input: abcabcbb
Output: 3
```
The answer is "abc", with length 3.""",
        "difficulty": "medium",
        "tags": ["string", "sliding-window", "hash-table"],
        "sample_input": "abcabcbb",
        "sample_output": "3",
        "test_cases": [
            {"input": "abcabcbb", "output": "3"},
            {"input": "bbbbb", "output": "1"},
            {"input": "pwwkew", "output": "3"}
        ],
        "hints": ["Use sliding window technique", "Track character positions with a hash map"],
        "constraints": "0 <= len(s) <= 5*10^4",
        "time_limit": 5
    },
    {
        "title": "Longest Palindromic Substring",
        "description": """Find the longest palindromic substring.

**Input Format:**
- A single string

**Output Format:**
- The longest palindrome

**Example:**
```
Input: babad
Output: bab
```
Note: "aba" is also valid.""",
        "difficulty": "medium",
        "tags": ["string", "dynamic-programming"],
        "sample_input": "babad",
        "sample_output": "bab",
        "test_cases": [
            {"input": "babad", "output": "bab"},
            {"input": "cbbd", "output": "bb"},
            {"input": "a", "output": "a"}
        ],
        "hints": ["Expand around center for each character", "Consider both odd and even length palindromes"],
        "constraints": "1 <= len(s) <= 1000",
        "time_limit": 5
    },
    {
        "title": "Add Two Numbers",
        "description": """Given two numbers represented as reversed linked lists, return their sum as a reversed list.

**Input Format:**
- Line 1: First number (reversed digits, space-separated)
- Line 2: Second number (reversed digits, space-separated)

**Output Format:**
- Sum as reversed digits (space-separated)

**Example:**
```
Input:
2 4 3
5 6 4

Output:
7 0 8
```
(342 + 465 = 807)""",
        "difficulty": "medium",
        "tags": ["linked-list", "math"],
        "sample_input": "2 4 3\n5 6 4",
        "sample_output": "7 0 8",
        "test_cases": [
            {"input": "2 4 3\n5 6 4", "output": "7 0 8"},
            {"input": "0\n0", "output": "0"},
            {"input": "9 9 9 9 9 9 9\n9 9 9 9", "output": "8 9 9 9 0 0 0 1"}
        ],
        "hints": ["Add digit by digit with carry", "Don't forget the final carry"],
        "constraints": "1 <= len(list) <= 100",
        "time_limit": 5
    },
    {
        "title": "Group Anagrams",
        "description": """Group strings that are anagrams of each other.

**Input Format:**
- Space-separated strings

**Output Format:**
- Each group on a new line (space-separated, sorted)

**Example:**
```
Input: eat tea tan ate nat bat
Output:
ate eat tea
bat
nat tan
```""",
        "difficulty": "medium",
        "tags": ["string", "hash-table", "sorting"],
        "sample_input": "eat tea tan ate nat bat",
        "sample_output": "ate eat tea\nbat\nnat tan",
        "test_cases": [
            {"input": "eat tea tan ate nat bat", "output": "ate eat tea\nbat\nnat tan"},
            {"input": "", "output": ""},
            {"input": "a", "output": "a"}
        ],
        "hints": ["Sort each string to get a key", "Use a dictionary with sorted string as key"],
        "constraints": "1 <= len(strs) <= 10^4",
        "time_limit": 5
    },
    {
        "title": "Product of Array Except Self",
        "description": """Return an array where output[i] is the product of all elements except nums[i], without using division.

**Input Format:**
- Space-separated integers

**Output Format:**
- Product array (space-separated)

**Example:**
```
Input: 1 2 3 4
Output: 24 12 8 6
```""",
        "difficulty": "medium",
        "tags": ["array", "prefix-sum"],
        "sample_input": "1 2 3 4",
        "sample_output": "24 12 8 6",
        "test_cases": [
            {"input": "1 2 3 4", "output": "24 12 8 6"},
            {"input": "-1 1 0 -3 3", "output": "0 0 9 0 0"}
        ],
        "hints": ["Calculate prefix products", "Then multiply with suffix products"],
        "constraints": "2 <= len(nums) <= 10^5",
        "time_limit": 5
    },
    {
        "title": "Number of Islands",
        "description": """Given a 2D grid of '1's (land) and '0's (water), count the islands.

**Input Format:**
- First line: rows cols
- Next rows: grid (space-separated)

**Output Format:**
- Number of islands

**Example:**
```
Input:
4 5
1 1 1 1 0
1 1 0 1 0
1 1 0 0 0
0 0 0 0 0

Output:
1
```""",
        "difficulty": "medium",
        "tags": ["graph", "dfs", "bfs", "matrix"],
        "sample_input": "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0",
        "sample_output": "1",
        "test_cases": [
            {"input": "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0", "output": "1"},
            {"input": "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1", "output": "3"}
        ],
        "hints": ["Use DFS or BFS from each unvisited land cell", "Mark visited cells to avoid recounting"],
        "constraints": "m, n <= 300",
        "time_limit": 5
    },
    {
        "title": "Course Schedule",
        "description": """Given numCourses and prerequisites, determine if you can finish all courses.

**Input Format:**
- Line 1: numCourses
- Following lines: course prerequisite pairs

**Output Format:**
- True or False

**Example:**
```
Input:
2
1 0

Output:
True
```""",
        "difficulty": "medium",
        "tags": ["graph", "dfs", "bfs", "topological-sort"],
        "sample_input": "2\n1 0",
        "sample_output": "True",
        "test_cases": [
            {"input": "2\n1 0", "output": "True"},
            {"input": "2\n1 0\n0 1", "output": "False"}
        ],
        "hints": ["Detect cycle in directed graph", "Use topological sort or DFS with colors"],
        "constraints": "1 <= numCourses <= 2000",
        "time_limit": 5
    },
    {
        "title": "Coin Change",
        "description": """Given coins and an amount, return fewest coins needed. Return -1 if impossible.

**Input Format:**
- Line 1: Coin denominations (space-separated)
- Line 2: Target amount

**Output Format:**
- Minimum coins or -1

**Example:**
```
Input:
1 2 5
11

Output:
3
```
(5 + 5 + 1 = 11)""",
        "difficulty": "medium",
        "tags": ["dynamic-programming", "bfs"],
        "sample_input": "1 2 5\n11",
        "sample_output": "3",
        "test_cases": [
            {"input": "1 2 5\n11", "output": "3"},
            {"input": "2\n3", "output": "-1"},
            {"input": "1\n0", "output": "0"}
        ],
        "hints": ["Use DP with dp[i] = min coins for amount i", "Try each coin and take minimum"],
        "constraints": "1 <= coins.length <= 12, 1 <= amount <= 10^4",
        "time_limit": 5
    },
    {
        "title": "Validate Binary Search Tree",
        "description": """Determine if a binary tree is a valid BST.

**Input Format:**
- Level-order traversal with 'null' for empty nodes

**Output Format:**
- True or False

**Example:**
```
Input: 2 1 3
Output: True
```""",
        "difficulty": "medium",
        "tags": ["tree", "binary-tree", "bst", "dfs"],
        "sample_input": "2 1 3",
        "sample_output": "True",
        "test_cases": [
            {"input": "2 1 3", "output": "True"},
            {"input": "5 1 4 null null 3 6", "output": "False"}
        ],
        "hints": ["Use inorder traversal - should be sorted", "Or track valid range for each node"],
        "constraints": "1 <= nodes <= 10^4",
        "time_limit": 5
    },
    {
        "title": "Lowest Common Ancestor",
        "description": """Find the lowest common ancestor of two nodes in a binary tree.

**Input Format:**
- Line 1: Tree (level-order, space-separated)
- Line 2: Two node values

**Output Format:**
- LCA value

**Example:**
```
Input:
3 5 1 6 2 0 8 null null 7 4
5 1

Output:
3
```""",
        "difficulty": "medium",
        "tags": ["tree", "binary-tree", "dfs"],
        "sample_input": "3 5 1 6 2 0 8 null null 7 4\n5 1",
        "sample_output": "3",
        "test_cases": [
            {"input": "3 5 1 6 2 0 8 null null 7 4\n5 1", "output": "3"},
            {"input": "3 5 1 6 2 0 8 null null 7 4\n5 4", "output": "5"}
        ],
        "hints": ["Recursively search left and right subtrees", "LCA is where both targets are found in different subtrees"],
        "constraints": "2 <= nodes <= 10^5",
        "time_limit": 5
    },
    {
        "title": "Word Search",
        "description": """Given a 2D board and a word, check if the word exists in the grid.

**Input Format:**
- First line: rows cols
- Next rows: the grid (characters)
- Last line: the word

**Output Format:**
- True or False

**Example:**
```
Input:
3 4
A B C E
S F C S
A D E E
ABCCED

Output:
True
```""",
        "difficulty": "medium",
        "tags": ["backtracking", "matrix", "dfs"],
        "sample_input": "3 4\nA B C E\nS F C S\nA D E E\nABCCED",
        "sample_output": "True",
        "test_cases": [
            {"input": "3 4\nA B C E\nS F C S\nA D E E\nABCCED", "output": "True"},
            {"input": "3 4\nA B C E\nS F C S\nA D E E\nSEE", "output": "True"},
            {"input": "3 4\nA B C E\nS F C S\nA D E E\nABCB", "output": "False"}
        ],
        "hints": ["Use DFS with backtracking", "Mark visited cells temporarily"],
        "constraints": "m, n <= 6, word.length <= 15",
        "time_limit": 5
    },
    {
        "title": "Rotate Image",
        "description": """Rotate an n×n matrix 90 degrees clockwise in-place.

**Input Format:**
- First line: n
- Next n lines: matrix rows

**Output Format:**
- Rotated matrix

**Example:**
```
Input:
3
1 2 3
4 5 6
7 8 9

Output:
7 4 1
8 5 2
9 6 3
```""",
        "difficulty": "medium",
        "tags": ["array", "matrix", "math"],
        "sample_input": "3\n1 2 3\n4 5 6\n7 8 9",
        "sample_output": "7 4 1\n8 5 2\n9 6 3",
        "test_cases": [
            {"input": "3\n1 2 3\n4 5 6\n7 8 9", "output": "7 4 1\n8 5 2\n9 6 3"},
            {"input": "2\n1 2\n3 4", "output": "3 1\n4 2"}
        ],
        "hints": ["First transpose the matrix", "Then reverse each row"],
        "constraints": "1 <= n <= 20",
        "time_limit": 5
    },
    {
        "title": "Spiral Matrix",
        "description": """Return all elements of matrix in spiral order.

**Input Format:**
- First line: rows cols
- Next rows: matrix

**Output Format:**
- Spiral order (space-separated)

**Example:**
```
Input:
3 3
1 2 3
4 5 6
7 8 9

Output:
1 2 3 6 9 8 7 4 5
```""",
        "difficulty": "medium",
        "tags": ["array", "matrix"],
        "sample_input": "3 3\n1 2 3\n4 5 6\n7 8 9",
        "sample_output": "1 2 3 6 9 8 7 4 5",
        "test_cases": [
            {"input": "3 3\n1 2 3\n4 5 6\n7 8 9", "output": "1 2 3 6 9 8 7 4 5"},
            {"input": "3 4\n1 2 3 4\n5 6 7 8\n9 10 11 12", "output": "1 2 3 4 8 12 11 10 9 5 6 7"}
        ],
        "hints": ["Use four boundaries: top, bottom, left, right", "Traverse and shrink boundaries"],
        "constraints": "m, n <= 10",
        "time_limit": 5
    },
    {
        "title": "Set Matrix Zeroes",
        "description": """If an element is 0, set its entire row and column to 0. Do it in-place.

**Input Format:**
- First line: rows cols
- Next rows: matrix

**Output Format:**
- Modified matrix

**Example:**
```
Input:
3 3
1 1 1
1 0 1
1 1 1

Output:
1 0 1
0 0 0
1 0 1
```""",
        "difficulty": "medium",
        "tags": ["array", "matrix"],
        "sample_input": "3 3\n1 1 1\n1 0 1\n1 1 1",
        "sample_output": "1 0 1\n0 0 0\n1 0 1",
        "test_cases": [
            {"input": "3 3\n1 1 1\n1 0 1\n1 1 1", "output": "1 0 1\n0 0 0\n1 0 1"},
            {"input": "3 4\n0 1 2 0\n3 4 5 2\n1 3 1 5", "output": "0 0 0 0\n0 4 5 0\n0 3 1 0"}
        ],
        "hints": ["Use first row and column as markers", "Handle first row/column separately"],
        "constraints": "m, n <= 200",
        "time_limit": 5
    },
    {
        "title": "Trapping Rain Water",
        "description": """Given elevation map, compute how much water can be trapped.

**Input Format:**
- Space-separated heights

**Output Format:**
- Total water trapped

**Example:**
```
Input: 0 1 0 2 1 0 1 3 2 1 2 1
Output: 6
```""",
        "difficulty": "hard",
        "tags": ["array", "two-pointers", "dynamic-programming", "stack"],
        "sample_input": "0 1 0 2 1 0 1 3 2 1 2 1",
        "sample_output": "6",
        "test_cases": [
            {"input": "0 1 0 2 1 0 1 3 2 1 2 1", "output": "6"},
            {"input": "4 2 0 3 2 5", "output": "9"}
        ],
        "hints": ["Water at each position = min(left_max, right_max) - height", "Use two pointers for O(1) space"],
        "constraints": "1 <= n <= 2*10^4",
        "time_limit": 5
    },
    {
        "title": "Median of Two Sorted Arrays",
        "description": """Find the median of two sorted arrays.

**Input Format:**
- Line 1: First sorted array (space-separated)
- Line 2: Second sorted array (space-separated)

**Output Format:**
- Median (with decimal if needed)

**Example:**
```
Input:
1 3
2

Output:
2.0
```""",
        "difficulty": "hard",
        "tags": ["array", "binary-search", "divide-and-conquer"],
        "sample_input": "1 3\n2",
        "sample_output": "2.0",
        "test_cases": [
            {"input": "1 3\n2", "output": "2.0"},
            {"input": "1 2\n3 4", "output": "2.5"}
        ],
        "hints": ["Binary search on the smaller array", "Partition both arrays correctly"],
        "constraints": "0 <= m, n <= 1000",
        "time_limit": 5
    },
    {
        "title": "Merge k Sorted Lists",
        "description": """Merge k sorted linked lists into one sorted list.

**Input Format:**
- Line 1: k (number of lists)
- Next k lines: each sorted list (space-separated)

**Output Format:**
- Merged list (space-separated)

**Example:**
```
Input:
3
1 4 5
1 3 4
2 6

Output:
1 1 2 3 4 4 5 6
```""",
        "difficulty": "hard",
        "tags": ["linked-list", "heap", "divide-and-conquer"],
        "sample_input": "3\n1 4 5\n1 3 4\n2 6",
        "sample_output": "1 1 2 3 4 4 5 6",
        "test_cases": [
            {"input": "3\n1 4 5\n1 3 4\n2 6", "output": "1 1 2 3 4 4 5 6"},
            {"input": "0\n", "output": ""}
        ],
        "hints": ["Use a min-heap to track smallest elements", "Or use divide and conquer to merge pairs"],
        "constraints": "k <= 10^4, total nodes <= 10^4",
        "time_limit": 5
    },
    {
        "title": "Word Ladder",
        "description": """Find shortest transformation from beginWord to endWord, changing one letter at a time.

**Input Format:**
- Line 1: beginWord
- Line 2: endWord
- Line 3: wordList (space-separated)

**Output Format:**
- Length of shortest transformation (0 if impossible)

**Example:**
```
Input:
hit
cog
hot dot dog lot log cog

Output:
5
```
hit -> hot -> dot -> dog -> cog""",
        "difficulty": "hard",
        "tags": ["graph", "bfs", "string"],
        "sample_input": "hit\ncog\nhot dot dog lot log cog",
        "sample_output": "5",
        "test_cases": [
            {"input": "hit\ncog\nhot dot dog lot log cog", "output": "5"},
            {"input": "hit\ncog\nhot dot dog lot log", "output": "0"}
        ],
        "hints": ["Use BFS for shortest path", "Build graph of words differing by one letter"],
        "constraints": "1 <= wordList.length <= 5000",
        "time_limit": 5
    },
    {
        "title": "N-Queens",
        "description": """Place n queens on an n×n chessboard so no two queens attack each other. Count solutions.

**Input Format:**
- A single integer n

**Output Format:**
- Number of distinct solutions

**Example:**
```
Input: 4
Output: 2
```""",
        "difficulty": "hard",
        "tags": ["backtracking", "recursion"],
        "sample_input": "4",
        "sample_output": "2",
        "test_cases": [
            {"input": "4", "output": "2"},
            {"input": "1", "output": "1"},
            {"input": "8", "output": "92"}
        ],
        "hints": ["Place queens row by row", "Check column, diagonal, and anti-diagonal conflicts"],
        "constraints": "1 <= n <= 9",
        "time_limit": 5
    },
    {
        "title": "Longest Valid Parentheses",
        "description": """Find the length of the longest valid (well-formed) parentheses substring.

**Input Format:**
- A string containing only '(' and ')'

**Output Format:**
- Length of longest valid substring

**Example:**
```
Input: )()())
Output: 4
```""",
        "difficulty": "hard",
        "tags": ["string", "dynamic-programming", "stack"],
        "sample_input": ")()())",
        "sample_output": "4",
        "test_cases": [
            {"input": ")()())", "output": "4"},
            {"input": "(()", "output": "2"},
            {"input": "", "output": "0"}
        ],
        "hints": ["Use a stack to track unmatched indices", "Or use DP with dp[i] = longest ending at i"],
        "constraints": "0 <= len(s) <= 3*10^4",
        "time_limit": 5
    },
    {
        "title": "Wildcard Matching",
        "description": """Implement wildcard pattern matching with '?' and '*'.

**Input Format:**
- Line 1: string
- Line 2: pattern

**Output Format:**
- True or False

**Example:**
```
Input:
aa
*

Output:
True
```""",
        "difficulty": "hard",
        "tags": ["string", "dynamic-programming", "greedy"],
        "sample_input": "aa\n*",
        "sample_output": "True",
        "test_cases": [
            {"input": "aa\n*", "output": "True"},
            {"input": "aa\na", "output": "False"},
            {"input": "cb\n?a", "output": "False"}
        ],
        "hints": ["Use DP with s[i] and p[j]", "* can match empty or any sequence"],
        "constraints": "0 <= s.length, p.length <= 2000",
        "time_limit": 5
    },
    {
        "title": "Regular Expression Matching",
        "description": """Implement regex matching with '.' and '*'.

**Input Format:**
- Line 1: string
- Line 2: pattern

**Output Format:**
- True or False

**Example:**
```
Input:
aa
a*

Output:
True
```""",
        "difficulty": "hard",
        "tags": ["string", "dynamic-programming", "recursion"],
        "sample_input": "aa\na*",
        "sample_output": "True",
        "test_cases": [
            {"input": "aa\na*", "output": "True"},
            {"input": "aa\na", "output": "False"},
            {"input": "ab\n.*", "output": "True"}
        ],
        "hints": ["* means zero or more of the preceding element", "Use DP or recursion with memoization"],
        "constraints": "0 <= s.length <= 20, 0 <= p.length <= 30",
        "time_limit": 5
    },
    {
        "title": "Edit Distance",
        "description": """Find minimum operations (insert, delete, replace) to convert word1 to word2.

**Input Format:**
- Line 1: word1
- Line 2: word2

**Output Format:**
- Minimum operations

**Example:**
```
Input:
horse
ros

Output:
3
```
horse -> rorse -> rose -> ros""",
        "difficulty": "hard",
        "tags": ["string", "dynamic-programming"],
        "sample_input": "horse\nros",
        "sample_output": "3",
        "test_cases": [
            {"input": "horse\nros", "output": "3"},
            {"input": "intention\nexecution", "output": "5"}
        ],
        "hints": ["Use 2D DP with dp[i][j]", "Consider insert, delete, and replace operations"],
        "constraints": "0 <= len(word) <= 500",
        "time_limit": 5
    },
    {
        "title": "Minimum Window Substring",
        "description": """Find minimum window in s containing all characters of t.

**Input Format:**
- Line 1: string s
- Line 2: string t

**Output Format:**
- Minimum window substring (or empty)

**Example:**
```
Input:
ADOBECODEBANC
ABC

Output:
BANC
```""",
        "difficulty": "hard",
        "tags": ["string", "sliding-window", "hash-table"],
        "sample_input": "ADOBECODEBANC\nABC",
        "sample_output": "BANC",
        "test_cases": [
            {"input": "ADOBECODEBANC\nABC", "output": "BANC"},
            {"input": "a\na", "output": "a"},
            {"input": "a\naa", "output": ""}
        ],
        "hints": ["Use sliding window with two pointers", "Track character counts with hash maps"],
        "constraints": "1 <= len(s), len(t) <= 10^5",
        "time_limit": 5
    },
    {
        "title": "Serialize and Deserialize Binary Tree",
        "description": """Design an algorithm to serialize and deserialize a binary tree.

**Input Format:**
- Level-order traversal with null markers

**Output Format:**
- Same format after serialize->deserialize round trip

**Example:**
```
Input: 1 2 3 null null 4 5
Output: 1 2 3 null null 4 5
```""",
        "difficulty": "hard",
        "tags": ["tree", "binary-tree", "design", "bfs"],
        "sample_input": "1 2 3 null null 4 5",
        "sample_output": "1 2 3 null null 4 5",
        "test_cases": [
            {"input": "1 2 3 null null 4 5", "output": "1 2 3 null null 4 5"},
            {"input": "", "output": ""}
        ],
        "hints": ["Use BFS for level-order", "Handle null nodes explicitly"],
        "constraints": "nodes <= 10^4",
        "time_limit": 5
    },
    {
        "title": "LRU Cache",
        "description": """Implement an LRU (Least Recently Used) cache with get and put in O(1).

**Input Format:**
- Line 1: capacity
- Following lines: operations (get/put key [value])

**Output Format:**
- Results of get operations (-1 if not found)

**Example:**
```
Input:
2
put 1 1
put 2 2
get 1
put 3 3
get 2

Output:
1
-1
```""",
        "difficulty": "medium",
        "tags": ["hash-table", "linked-list", "design"],
        "sample_input": "2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2",
        "sample_output": "1\n-1",
        "test_cases": [
            {"input": "2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2", "output": "1\n-1"}
        ],
        "hints": ["Use hash map + doubly linked list", "Move accessed items to front"],
        "constraints": "1 <= capacity <= 3000",
        "time_limit": 5
    },
    {
        "title": "Maximum Profit in Job Scheduling",
        "description": """Given jobs with start, end, and profit, find max profit without overlapping.

**Input Format:**
- Line 1: number of jobs
- Following lines: start end profit

**Output Format:**
- Maximum profit

**Example:**
```
Input:
4
1 3 50
2 4 10
3 5 40
3 6 70

Output:
120
```""",
        "difficulty": "hard",
        "tags": ["dynamic-programming", "binary-search", "sorting"],
        "sample_input": "4\n1 3 50\n2 4 10\n3 5 40\n3 6 70",
        "sample_output": "120",
        "test_cases": [
            {"input": "4\n1 3 50\n2 4 10\n3 5 40\n3 6 70", "output": "120"},
            {"input": "3\n1 2 50\n3 4 10\n2 3 100", "output": "150"}
        ],
        "hints": ["Sort jobs by end time", "Use DP with binary search for previous non-overlapping job"],
        "constraints": "1 <= jobs <= 5*10^4",
        "time_limit": 5
    },
    {
        "title": "Sliding Window Maximum",
        "description": """Return max values in each sliding window of size k.

**Input Format:**
- Line 1: array (space-separated)
- Line 2: k (window size)

**Output Format:**
- Max values (space-separated)

**Example:**
```
Input:
1 3 -1 -3 5 3 6 7
3

Output:
3 3 5 5 6 7
```""",
        "difficulty": "hard",
        "tags": ["array", "sliding-window", "deque", "heap"],
        "sample_input": "1 3 -1 -3 5 3 6 7\n3",
        "sample_output": "3 3 5 5 6 7",
        "test_cases": [
            {"input": "1 3 -1 -3 5 3 6 7\n3", "output": "3 3 5 5 6 7"},
            {"input": "1\n1", "output": "1"}
        ],
        "hints": ["Use a monotonic deque", "Store indices, remove smaller elements from back"],
        "constraints": "1 <= len(nums), k <= 10^5",
        "time_limit": 5
    },
    {
        "title": "Count of Smaller Numbers After Self",
        "description": """For each element, count elements to its right that are smaller.

**Input Format:**
- Space-separated integers

**Output Format:**
- Counts (space-separated)

**Example:**
```
Input: 5 2 6 1
Output: 2 1 1 0
```""",
        "difficulty": "hard",
        "tags": ["array", "binary-search", "divide-and-conquer", "segment-tree"],
        "sample_input": "5 2 6 1",
        "sample_output": "2 1 1 0",
        "test_cases": [
            {"input": "5 2 6 1", "output": "2 1 1 0"},
            {"input": "-1", "output": "0"},
            {"input": "-1 -1", "output": "0 0"}
        ],
        "hints": ["Use merge sort with counting", "Or use BST/segment tree"],
        "constraints": "1 <= len(nums) <= 10^5",
        "time_limit": 5
    },
    {
        "title": "Burst Balloons",
        "description": """Given balloons with numbers, maximize coins from bursting all (product of adjacent).

**Input Format:**
- Space-separated balloon values

**Output Format:**
- Maximum coins

**Example:**
```
Input: 3 1 5 8
Output: 167
```
Burst 1: coins = 3*1*5 = 15
Burst 5: coins = 3*5*8 = 120
Burst 3: coins = 1*3*8 = 24
Burst 8: coins = 1*8*1 = 8
Total = 167""",
        "difficulty": "hard",
        "tags": ["dynamic-programming", "divide-and-conquer"],
        "sample_input": "3 1 5 8",
        "sample_output": "167",
        "test_cases": [
            {"input": "3 1 5 8", "output": "167"},
            {"input": "1 5", "output": "10"}
        ],
        "hints": ["Think in reverse: which balloon to burst last?", "Use interval DP"],
        "constraints": "1 <= len(nums) <= 300",
        "time_limit": 5
    }
]
