"""
CodeArena - 50+ Problems Seed Data
Categories: Arrays, Strings, DP, Math, Stack, Two Pointers, Trees, Graphs
"""
from datetime import datetime, timezone
import uuid

def get_all_problems():
    now = datetime.now(timezone.utc).isoformat()

    def p(title, desc, diff, tags, company_tags, sin, sout, tcs, hints, constraints, tl=5):
        return {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": desc,
            "difficulty": diff,
            "tags": tags,
            "company_tags": company_tags,
            "sample_input": sin,
            "sample_output": sout,
            "test_cases": tcs,
            "hints": hints,
            "constraints": constraints,
            "time_limit": tl,
            "solved_count": 0,
            "created_by": "admin",
            "created_at": now,
        }

    return [
        # ─── ARRAYS ───────────────────────────────────────────
        p("Contains Duplicate",
          """Given a list of integers, return `True` if any value appears **at least twice**, `False` if every element is distinct.

**Input:** Space-separated integers
**Output:** True or False

**Example:**
```
Input: 1 2 3 1
Output: True
```""",
          "easy", ["array","hash-table"], ["amazon","google"],
          "1 2 3 1", "True",
          [{"input":"1 2 3 1","output":"True"},{"input":"1 2 3 4","output":"False"},{"input":"1 1 1 3 3 4 3 2 4 2","output":"True"}],
          ["Use a set to track seen elements.",
           "As you iterate, if the current element is already in the set → True.",
           "If you finish without finding a duplicate → False."],
          "1 <= n <= 10^5, -10^9 <= nums[i] <= 10^9"),

        p("Best Time to Buy and Sell Stock",
          """You are given prices of a stock on each day. Find the **maximum profit** you can achieve by buying on one day and selling on a later day. Return 0 if no profit is possible.

**Input:** Space-separated integers (prices)
**Output:** Maximum profit

**Example:**
```
Input: 7 1 5 3 6 4
Output: 5
```
Buy on day 2 (price=1), sell on day 5 (price=6), profit = 5.""",
          "easy", ["array","greedy"], ["amazon","google","meta"],
          "7 1 5 3 6 4", "5",
          [{"input":"7 1 5 3 6 4","output":"5"},{"input":"7 6 4 3 1","output":"0"},{"input":"2 4 1","output":"2"}],
          ["Track the minimum price seen so far.",
           "At each day, compute profit = current_price - min_price_so_far.",
           "Update max_profit if this profit is higher."],
          "1 <= n <= 10^5, 0 <= prices[i] <= 10^4"),

        p("Product of Array Except Self",
          """Given an integer array, return an array where each element is the **product of all elements except itself**. Do not use division.

**Input:** Space-separated integers
**Output:** Space-separated products

**Example:**
```
Input: 1 2 3 4
Output: 24 12 8 6
```""",
          "medium", ["array","prefix-sum"], ["amazon","google","microsoft"],
          "1 2 3 4", "24 12 8 6",
          [{"input":"1 2 3 4","output":"24 12 8 6"},{"input":"-1 1 0 -3 3","output":"0 0 9 0 0"},{"input":"2 3","output":"3 2"}],
          ["Compute prefix products (left side of each element).",
           "Compute suffix products (right side of each element).",
           "result[i] = prefix[i] * suffix[i]. Use two passes: one left-to-right, one right-to-left."],
          "2 <= n <= 10^5, -30 <= nums[i] <= 30"),

        p("Maximum Product Subarray",
          """Find the contiguous subarray with the **largest product** and return that product.

**Input:** Space-separated integers
**Output:** Maximum product

**Example:**
```
Input: 2 3 -2 4
Output: 6
```""",
          "medium", ["array","dynamic-programming"], ["google","amazon"],
          "2 3 -2 4", "6",
          [{"input":"2 3 -2 4","output":"6"},{"input":"-2 0 -1","output":"0"},{"input":"-2 3 -4","output":"24"}],
          ["Track both the maximum and minimum product ending at each index (negatives can flip).",
           "At each element: new_max = max(num, max_prod*num, min_prod*num); new_min = min(...).",
           "The answer is the max of all max_prods seen."],
          "1 <= n <= 2*10^4, -10 <= nums[i] <= 10"),

        p("Find Minimum in Rotated Sorted Array",
          """A sorted array was rotated at some pivot. Find the minimum element.

**Input:** Space-separated integers (rotated sorted array, no duplicates)
**Output:** Minimum element

**Example:**
```
Input: 3 4 5 1 2
Output: 1
```""",
          "medium", ["array","binary-search"], ["google","microsoft"],
          "3 4 5 1 2", "1",
          [{"input":"3 4 5 1 2","output":"1"},{"input":"4 5 6 7 0 1 2","output":"0"},{"input":"11 13 15 17","output":"11"}],
          ["Use binary search. The minimum is the only element smaller than its previous element.",
           "If nums[mid] > nums[right], the min is in the right half. Otherwise it's in the left.",
           "When left == right, you've found the minimum."],
          "n >= 1, all elements are unique"),

        p("Majority Element",
          """Given an array, find the element that appears **more than n/2 times**.

**Input:** Space-separated integers
**Output:** Majority element

**Example:**
```
Input: 3 2 3
Output: 3
```""",
          "easy", ["array","hash-table","sorting"], ["amazon","microsoft"],
          "3 2 3", "3",
          [{"input":"3 2 3","output":"3"},{"input":"2 2 1 1 1 2 2","output":"2"},{"input":"6 5 5","output":"5"}],
          ["Count occurrences using a dictionary.",
           "Boyer-Moore Voting: maintain a candidate and count. Increment if same, decrement if different, reset if 0.",
           "The candidate at the end is the majority element."],
          "n >= 1, majority element always exists"),

        p("Rotate Array",
          """Rotate an array to the right by **k** steps.

**Input:** Line 1 = space-separated integers. Line 2 = k
**Output:** Rotated array (space-separated)

**Example:**
```
Input:
1 2 3 4 5 6 7
3
Output: 5 6 7 1 2 3 4
```""",
          "medium", ["array","two-pointers"], ["microsoft","amazon"],
          "1 2 3 4 5 6 7\n3", "5 6 7 1 2 3 4",
          [{"input":"1 2 3 4 5 6 7\n3","output":"5 6 7 1 2 3 4"},{"input":"-1 -100 3 99\n2","output":"3 99 -1 -100"},{"input":"1 2\n3","output":"2 1"}],
          ["k = k % n to handle k > n.",
           "Use slicing: result = nums[-k:] + nums[:-k]",
           "Or reverse the whole array, then reverse first k, then reverse rest."],
          "1 <= n <= 10^5, 0 <= k <= 10^5"),

        p("Max Consecutive Ones",
          """Given a binary array, find the maximum number of **consecutive 1s**.

**Input:** Space-separated 0s and 1s
**Output:** Max consecutive 1s count

**Example:**
```
Input: 1 1 0 1 1 1
Output: 3
```""",
          "easy", ["array"], ["google"],
          "1 1 0 1 1 1", "3",
          [{"input":"1 1 0 1 1 1","output":"3"},{"input":"1 0 1 1 0 1","output":"2"},{"input":"0 0 0","output":"0"}],
          ["Use two variables: current_count and max_count.",
           "Reset current_count to 0 when you see a 0.",
           "Update max_count = max(max_count, current_count) at each step."],
          "1 <= n <= 10^5, nums[i] is 0 or 1"),

        p("Remove Duplicates from Sorted Array",
          """Remove duplicates from a **sorted array** in-place and return the count of unique elements.

**Input:** Space-separated sorted integers
**Output:** Count of unique elements, then the unique elements

**Example:**
```
Input: 1 1 2
Output: 2
1 2
```""",
          "easy", ["array","two-pointers"], ["google","amazon","microsoft"],
          "1 1 2", "2\n1 2",
          [{"input":"1 1 2","output":"2\n1 2"},{"input":"0 0 1 1 1 2 2 3 3 4","output":"5\n0 1 2 3 4"},{"input":"1","output":"1\n1"}],
          ["Use a two-pointer approach: slow pointer tracks unique position, fast pointer scans ahead.",
           "When nums[fast] != nums[slow], move slow forward and copy.",
           "Return slow + 1 as the unique count."],
          "1 <= n <= 3*10^4, sorted in non-decreasing order"),

        p("Running Sum of 1D Array",
          """Given an array, return the **running sum** where running_sum[i] = sum(nums[0..i]).

**Input:** Space-separated integers
**Output:** Space-separated running sums

**Example:**
```
Input: 1 2 3 4
Output: 1 3 6 10
```""",
          "easy", ["array","prefix-sum"], ["amazon"],
          "1 2 3 4", "1 3 6 10",
          [{"input":"1 2 3 4","output":"1 3 6 10"},{"input":"1 1 1 1 1","output":"1 2 3 4 5"},{"input":"3 1 2 10 1","output":"3 4 6 16 17"}],
          ["Iterate through the array, maintaining a running total.",
           "Use itertools.accumulate(nums) for a one-liner.",
           "result[i] = result[i-1] + nums[i]"],
          "1 <= n <= 1000, -10^6 <= nums[i] <= 10^6"),

        # ─── TWO POINTERS ─────────────────────────────────────
        p("Move Zeroes",
          """Move all **0s** to the end while maintaining the relative order of non-zero elements.

**Input:** Space-separated integers
**Output:** Modified array

**Example:**
```
Input: 0 1 0 3 12
Output: 1 3 12 0 0
```""",
          "easy", ["array","two-pointers"], ["meta","amazon"],
          "0 1 0 3 12", "1 3 12 0 0",
          [{"input":"0 1 0 3 12","output":"1 3 12 0 0"},{"input":"0","output":"0"},{"input":"0 0 1","output":"1 0 0"}],
          ["Use a slow pointer that tracks where the next non-zero should go.",
           "Iterate with a fast pointer; when non-zero found, place it at slow and advance slow.",
           "Fill the rest with zeros."],
          "1 <= n <= 10^4"),

        p("Container With Most Water",
          """Given n vertical lines (heights), find two that together with the x-axis form a container holding the most water.

**Input:** Space-separated heights
**Output:** Maximum water

**Example:**
```
Input: 1 8 6 2 5 4 8 3 7
Output: 49
```""",
          "medium", ["array","two-pointers","greedy"], ["google","amazon","meta"],
          "1 8 6 2 5 4 8 3 7", "49",
          [{"input":"1 8 6 2 5 4 8 3 7","output":"49"},{"input":"1 1","output":"1"},{"input":"4 3 2 1 4","output":"16"}],
          ["Use two pointers at both ends. Compute area = min(h[left], h[right]) * (right-left).",
           "Move the pointer with the smaller height inward (there's no benefit keeping it).",
           "Track the maximum area throughout."],
          "n >= 2, 0 <= heights[i] <= 10^4"),

        p("Trapping Rain Water",
          """Given an elevation map, compute how much water it can trap after raining.

**Input:** Space-separated heights
**Output:** Total trapped water

**Example:**
```
Input: 0 1 0 2 1 0 1 3 2 1 2 1
Output: 6
```""",
          "hard", ["array","two-pointers","stack","dynamic-programming"], ["amazon","google","microsoft"],
          "0 1 0 2 1 0 1 3 2 1 2 1", "6",
          [{"input":"0 1 0 2 1 0 1 3 2 1 2 1","output":"6"},{"input":"4 2 0 3 2 5","output":"9"},{"input":"3 0 2 0 4","output":"7"}],
          ["For each position, water = min(max_left, max_right) - height[i].",
           "Two-pointer approach: maintain left_max and right_max, process the smaller side.",
           "Move left pointer if height[left] < height[right], else move right."],
          "n >= 0, 0 <= heights[i] <= 10^5"),

        p("Sort Colors (Dutch National Flag)",
          """Sort an array of 0s, 1s, and 2s **in-place** in a single pass.

**Input:** Space-separated 0s, 1s, 2s
**Output:** Sorted array

**Example:**
```
Input: 2 0 2 1 1 0
Output: 0 0 1 1 2 2
```""",
          "medium", ["array","two-pointers","sorting"], ["microsoft","amazon"],
          "2 0 2 1 1 0", "0 0 1 1 2 2",
          [{"input":"2 0 2 1 1 0","output":"0 0 1 1 2 2"},{"input":"2 0 1","output":"0 1 2"},{"input":"0","output":"0"}],
          ["Dutch National Flag algorithm uses 3 pointers: lo, mid, hi.",
           "If arr[mid]=0 → swap with arr[lo], advance both. If =1 → advance mid. If =2 → swap with arr[hi], decrement hi.",
           "Continue while mid <= hi."],
          "n >= 1, nums[i] in {0, 1, 2}"),

        p("3Sum Count",
          """Count the number of **unique triplets** in the array that sum to zero.

**Input:** Space-separated integers
**Output:** Count of unique zero-sum triplets

**Example:**
```
Input: -1 0 1 2 -1 -4
Output: 2
```
Triplets: [-1,-1,2] and [-1,0,1]""",
          "medium", ["array","two-pointers","sorting"], ["amazon","google","meta"],
          "-1 0 1 2 -1 -4", "2",
          [{"input":"-1 0 1 2 -1 -4","output":"2"},{"input":"0","output":"0"},{"input":"0 0 0","output":"1"}],
          ["Sort the array first.",
           "For each index i, use two pointers l=i+1, r=n-1. Move them to find pairs summing to -nums[i].",
           "Skip duplicates to avoid counting the same triplet twice."],
          "0 <= n <= 3000, -10^5 <= nums[i] <= 10^5"),

        # ─── STRINGS ──────────────────────────────────────────
        p("Valid Anagram",
          """Given two strings, determine if the second is an **anagram** of the first.

**Input:** Two strings on the same line (space-separated)
**Output:** True or False

**Example:**
```
Input: anagram nagaram
Output: True
```""",
          "easy", ["string","hash-table","sorting"], ["amazon","google","microsoft"],
          "anagram nagaram", "True",
          [{"input":"anagram nagaram","output":"True"},{"input":"rat car","output":"False"},{"input":"aacc ccac","output":"True"}],
          ["Sort both strings and compare.",
           "Use a frequency counter (dict) for each string and compare.",
           "Use collections.Counter(s) == collections.Counter(t)."],
          "1 <= len(s), len(t) <= 5*10^4, lowercase letters only"),

        p("Longest Substring Without Repeating Characters",
          """Find the length of the **longest substring without repeating characters**.

**Input:** A string
**Output:** Length of longest unique-char substring

**Example:**
```
Input: abcabcbb
Output: 3
```
The answer is "abc" with length 3.""",
          "medium", ["string","sliding-window","hash-table"], ["amazon","google","microsoft","meta"],
          "abcabcbb", "3",
          [{"input":"abcabcbb","output":"3"},{"input":"bbbbb","output":"1"},{"input":"pwwkew","output":"3"},{"input":"","output":"0"}],
          ["Use a sliding window with a set of current characters.",
           "Maintain left and right pointers. Expand right, shrink left when duplicate found.",
           "Track max window size throughout."],
          "0 <= len(s) <= 5*10^4"),

        p("Reverse Words in a String",
          """Reverse the order of **words** in a sentence. Remove extra spaces.

**Input:** A string with words
**Output:** Words in reversed order

**Example:**
```
Input: the sky is blue
Output: blue is sky the
```""",
          "medium", ["string","two-pointers"], ["microsoft","amazon"],
          "the sky is blue", "blue is sky the",
          [{"input":"the sky is blue","output":"blue is sky the"},{"input":"  hello world  ","output":"world hello"},{"input":"a good   example","output":"example good a"}],
          ["Split the string by spaces and filter empty strings.",
           "Reverse the list of words and join with a single space.",
           "s.split()[::-1] gives you reversed words (split() handles multiple spaces)."],
          "1 <= len(s) <= 10^4"),

        p("String Compression",
          """Compress a string by replacing consecutive repeated characters with the character followed by its count.

**Input:** A string of lowercase letters
**Output:** Compressed string

**Example:**
```
Input: aabcccccaaa
Output: a2b1c5a3
```""",
          "easy", ["string","two-pointers"], ["amazon","microsoft"],
          "aabcccccaaa", "a2b1c5a3",
          [{"input":"aabcccccaaa","output":"a2b1c5a3"},{"input":"abc","output":"a1b1c1"},{"input":"aabb","output":"a2b2"}],
          ["Iterate through string, tracking current char and its count.",
           "When character changes, append char+count to result.",
           "Don't forget to append the last group after the loop."],
          "1 <= len(s) <= 10^4, lowercase letters only"),

        p("Count Palindromic Substrings",
          """Count the number of **palindromic substrings** in a string. Single characters count.

**Input:** A string
**Output:** Count of palindromic substrings

**Example:**
```
Input: abc
Output: 3
```
Each character is a palindrome: "a","b","c".""",
          "medium", ["string","dynamic-programming","expand-around-center"], ["google","amazon"],
          "abc", "3",
          [{"input":"abc","output":"3"},{"input":"aaa","output":"6"},{"input":"abba","output":"6"}],
          ["Expand around center: for each character (and each pair), expand outward while chars match.",
           "Count palindromes by expanding from each center (odd-length and even-length).",
           "There are 2n-1 possible centers for a string of length n."],
          "1 <= len(s) <= 1000, lowercase letters only"),

        p("Group Anagrams Count",
          """Group words that are anagrams of each other. Return the number of groups.

**Input:** Space-separated words
**Output:** Number of anagram groups

**Example:**
```
Input: eat tea tan ate nat bat
Output: 3
```
Groups: [eat,tea,ate], [tan,nat], [bat]""",
          "medium", ["string","hash-table","sorting"], ["amazon","google","meta"],
          "eat tea tan ate nat bat", "3",
          [{"input":"eat tea tan ate nat bat","output":"3"},{"input":"a","output":"1"},{"input":"abc bca cab abc","output":"1"}],
          ["For each word, create a key by sorting its characters.",
           "Group words with the same sorted key into a dictionary.",
           "The number of unique keys is the answer."],
          "1 <= n <= 10^4, each word is lowercase letters"),

        p("Longest Palindromic Substring Length",
          """Find the length of the **longest palindromic substring**.

**Input:** A string
**Output:** Length of longest palindrome

**Example:**
```
Input: babad
Output: 3
```
"bab" or "aba" both have length 3.""",
          "medium", ["string","dynamic-programming","expand-around-center"], ["amazon","google","microsoft"],
          "babad", "3",
          [{"input":"babad","output":"3"},{"input":"cbbd","output":"2"},{"input":"a","output":"1"},{"input":"racecar","output":"7"}],
          ["Expand around center for each position.",
           "Try both odd-length (center at i) and even-length (center between i and i+1) palindromes.",
           "Track the maximum palindrome length found."],
          "1 <= len(s) <= 1000"),

        # ─── STACK ────────────────────────────────────────────
        p("Evaluate Reverse Polish Notation",
          """Evaluate an arithmetic expression in **Reverse Polish Notation** (postfix). Operations: +, -, *, /

**Input:** Space-separated tokens
**Output:** Integer result

**Example:**
```
Input: 2 1 + 3 *
Output: 9
```
((2 + 1) * 3) = 9""",
          "medium", ["stack","math"], ["amazon","google"],
          "2 1 + 3 *", "9",
          [{"input":"2 1 + 3 *","output":"9"},{"input":"4 13 5 / +","output":"6"},{"input":"10 6 9 3 + -11 * / * 17 + 5 +","output":"22"}],
          ["Use a stack. Push operands, apply operators to top two elements.",
           "For /, truncate towards zero: int(a/b).",
           "Each operator pops two values, computes, and pushes the result."],
          "1 <= len(tokens) <= 10^4"),

        p("Daily Temperatures",
          """For each day, find how many days until a **warmer temperature**. Output 0 if no warmer day.

**Input:** Space-separated temperatures
**Output:** Space-separated wait days

**Example:**
```
Input: 73 74 75 71 69 72 76 73
Output: 1 1 4 2 1 1 0 0
```""",
          "medium", ["stack","monotonic-stack","array"], ["amazon","google"],
          "73 74 75 71 69 72 76 73", "1 1 4 2 1 1 0 0",
          [{"input":"73 74 75 71 69 72 76 73","output":"1 1 4 2 1 1 0 0"},{"input":"30 40 50 60","output":"1 1 1 0"},{"input":"30 60 90","output":"1 1 0"}],
          ["Use a monotonic decreasing stack storing indices.",
           "When current temp > temp at stack top, pop and compute difference in indices.",
           "This gives the wait days for the popped index."],
          "1 <= n <= 10^5, 30 <= temp <= 100"),

        p("Largest Rectangle in Histogram",
          """Find the area of the **largest rectangle** that can be formed in a histogram.

**Input:** Space-separated bar heights
**Output:** Maximum rectangle area

**Example:**
```
Input: 2 1 5 6 2 3
Output: 10
```""",
          "hard", ["stack","monotonic-stack","array"], ["amazon","google","microsoft"],
          "2 1 5 6 2 3", "10",
          [{"input":"2 1 5 6 2 3","output":"10"},{"input":"2 4","output":"4"},{"input":"6 2 5 4 5 1 6","output":"12"}],
          ["Use a monotonic increasing stack.",
           "When current height < height at stack top, pop and compute area with the popped height as the shortest bar.",
           "Append a 0 sentinel at the end to flush all remaining bars from the stack."],
          "1 <= n <= 10^5, 0 <= heights[i] <= 10^4"),

        p("Decode String",
          """Decode a string encoded as k[encoded_string] meaning encoded_string repeated k times.

**Input:** Encoded string
**Output:** Decoded string

**Example:**
```
Input: 3[a]2[bc]
Output: aaabcbc
```""",
          "medium", ["stack","string","recursion"], ["google","amazon","microsoft"],
          "3[a]2[bc]", "aaabcbc",
          [{"input":"3[a]2[bc]","output":"aaabcbc"},{"input":"3[a2[c]]","output":"accaccacc"},{"input":"2[abc]3[cd]ef","output":"abcabccdcdcdef"}],
          ["Use a stack. Push current string and count when you see '['.",
           "When you see ']', pop count and previous string, then append repeated current string.",
           "Build the result character by character using the stack."],
          "1 <= len(s) <= 30, no nested more than 3 levels"),

        p("Min Stack (Operations)",
          """Implement a stack that supports push, pop, and getMin in O(1).

**Input:** Operations line by line: push X, pop, min
**Output:** Output of each 'min' operation

**Example:**
```
Input:
push -2
push 0
push -3
min
pop
min
Output:
-3
-2
```""",
          "medium", ["stack","design"], ["amazon","microsoft","google"],
          "push -2\npush 0\npush -3\nmin\npop\nmin", "-3\n-2",
          [{"input":"push -2\npush 0\npush -3\nmin\npop\nmin","output":"-3\n-2"},{"input":"push 5\npush 3\npush 7\nmin\npop\nmin","output":"3\n3"},{"input":"push 1\nmin","output":"1"}],
          ["Use two stacks: one for values, one for minimums.",
           "When pushing, also push min(new_val, current_min) to the min stack.",
           "When popping, pop from both stacks."],
          "1 <= operations <= 3*10^4"),

        # ─── DYNAMIC PROGRAMMING ──────────────────────────────
        p("Climbing Stairs",
          """You can climb 1 or 2 steps at a time. How many **distinct ways** can you reach the top?

**Input:** n (number of steps)
**Output:** Number of ways

**Example:**
```
Input: 5
Output: 8
```""",
          "easy", ["dynamic-programming","math","memoization"], ["amazon","google","microsoft"],
          "5", "8",
          [{"input":"5","output":"8"},{"input":"2","output":"2"},{"input":"10","output":"89"}],
          ["This is the Fibonacci sequence: ways(n) = ways(n-1) + ways(n-2).",
           "Base cases: ways(1) = 1, ways(2) = 2.",
           "Iterate from 3 to n, keeping only the last two values."],
          "1 <= n <= 45"),

        p("House Robber",
          """Rob houses in a row without robbing two **adjacent** houses. Maximize total amount.

**Input:** Space-separated house amounts
**Output:** Maximum robbery amount

**Example:**
```
Input: 2 7 9 3 1
Output: 12
```
Rob houses 1, 3, 5: 2+9+1=12""",
          "medium", ["dynamic-programming","array"], ["amazon","google","microsoft"],
          "2 7 9 3 1", "12",
          [{"input":"2 7 9 3 1","output":"12"},{"input":"1 2 3 1","output":"4"},{"input":"2 1 1 2","output":"4"}],
          ["dp[i] = max(dp[i-1], dp[i-2] + nums[i]).",
           "You either skip house i (take dp[i-1]) or rob it (dp[i-2] + nums[i]).",
           "Only need to track prev2 and prev1, not the full array."],
          "1 <= n <= 100, 0 <= nums[i] <= 400"),

        p("Coin Change",
          """Given coin denominations and a target amount, find the **minimum number of coins** to make the amount. Return -1 if impossible.

**Input:** Line 1 = amount, Line 2 = space-separated coin denominations
**Output:** Minimum coins (-1 if impossible)

**Example:**
```
Input:
11
1 5 6 9
Output: 2
```
6+5=11 or 9+1+1=11... minimum is 2 (5+6)""",
          "medium", ["dynamic-programming","breadth-first-search"], ["amazon","google","microsoft"],
          "11\n1 5 6 9", "2",
          [{"input":"11\n1 5 6 9","output":"2"},{"input":"3\n2","output":"-1"},{"input":"0\n1","output":"0"}],
          ["Use bottom-up DP: dp[i] = min coins to make amount i.",
           "For each amount from 1 to target, try all coins.",
           "dp[i] = min(dp[i-coin] + 1) for all coins <= i. Initialize dp with infinity."],
          "1 <= coins.length <= 12, 1 <= coins[i] <= 2^31-1, 0 <= amount <= 10^4"),

        p("Unique Paths",
          """A robot on an m×n grid wants to move from top-left to bottom-right. How many **unique paths** are there (only moving right or down)?

**Input:** m n (space-separated)
**Output:** Number of unique paths

**Example:**
```
Input: 3 7
Output: 28
```""",
          "medium", ["dynamic-programming","math","combinatorics"], ["amazon","google","microsoft"],
          "3 7", "28",
          [{"input":"3 7","output":"28"},{"input":"3 2","output":"3"},{"input":"7 3","output":"28"},{"input":"3 3","output":"6"}],
          ["dp[i][j] = dp[i-1][j] + dp[i][j-1] (from top + from left).",
           "Base cases: all cells in row 0 or col 0 have 1 path.",
           "Math formula: C(m+n-2, m-1) = (m+n-2)! / ((m-1)! * (n-1)!)"],
          "1 <= m, n <= 100"),

        p("Longest Common Subsequence",
          """Find the length of the **longest common subsequence** of two strings.

**Input:** Two strings on the same line (space-separated)
**Output:** LCS length

**Example:**
```
Input: abcde ace
Output: 3
```""",
          "medium", ["dynamic-programming","string"], ["amazon","google","microsoft"],
          "abcde ace", "3",
          [{"input":"abcde ace","output":"3"},{"input":"abc abc","output":"3"},{"input":"abc def","output":"0"},{"input":"ezupkr ubmrapg","output":"2"}],
          ["Create a 2D DP table dp[i][j] = LCS length for s1[:i] and s2[:j].",
           "If s1[i-1] == s2[j-1]: dp[i][j] = dp[i-1][j-1] + 1.",
           "Else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])."],
          "1 <= len(s1), len(s2) <= 1000"),

        p("Longest Increasing Subsequence",
          """Find the length of the **longest strictly increasing subsequence**.

**Input:** Space-separated integers
**Output:** LIS length

**Example:**
```
Input: 10 9 2 5 3 7 101 18
Output: 4
```
LIS: [2,3,7,101] or [2,5,7,101]""",
          "medium", ["dynamic-programming","binary-search"], ["amazon","google","microsoft"],
          "10 9 2 5 3 7 101 18", "4",
          [{"input":"10 9 2 5 3 7 101 18","output":"4"},{"input":"0 1 0 3 2 3","output":"4"},{"input":"7 7 7 7 7","output":"1"}],
          ["O(n^2): dp[i] = max(dp[j]+1) for all j < i where nums[j] < nums[i].",
           "O(n log n): Maintain a list 'tails' where tails[i] is smallest tail of all increasing subseq of length i+1.",
           "Use bisect.bisect_left to find position in tails."],
          "1 <= n <= 2500, -10^4 <= nums[i] <= 10^4"),

        p("Jump Game",
          """Each element represents the **maximum jump length** from that position. Can you reach the last index?

**Input:** Space-separated jump lengths
**Output:** True or False

**Example:**
```
Input: 2 3 1 1 4
Output: True
```""",
          "medium", ["array","dynamic-programming","greedy"], ["amazon","google","microsoft"],
          "2 3 1 1 4", "True",
          [{"input":"2 3 1 1 4","output":"True"},{"input":"3 2 1 0 4","output":"False"},{"input":"0","output":"True"}],
          ["Track the maximum reachable index.",
           "Iterate: if current index > max_reach, return False. Update max_reach = max(max_reach, i + nums[i]).",
           "If max_reach >= n-1 at any point, return True."],
          "1 <= n <= 3*10^4, 0 <= nums[i] <= 10^5"),

        p("Word Break",
          """Given a string and a dictionary of words, determine if the string can be segmented into dictionary words.

**Input:** Line 1 = string, Line 2 = space-separated dictionary words
**Output:** True or False

**Example:**
```
Input:
leetcode
leet code
Output: True
```""",
          "medium", ["dynamic-programming","string","trie"], ["amazon","google","meta"],
          "leetcode\nleet code", "True",
          [{"input":"leetcode\nleet code","output":"True"},{"input":"applepenapple\napple pen","output":"True"},{"input":"catsandog\ncats dog sand and cat","output":"False"}],
          ["dp[i] = True if s[:i] can be segmented.",
           "For each i, try all j < i: if dp[j] is True and s[j:i] is in wordSet, then dp[i] = True.",
           "dp[0] = True (empty string)."],
          "1 <= len(s) <= 300, 1 <= wordDict.length <= 1000"),

        p("Edit Distance",
          """Find the **minimum number of operations** (insert, delete, replace) to convert word1 to word2.

**Input:** Two words on the same line (space-separated)
**Output:** Minimum edit distance

**Example:**
```
Input: horse ros
Output: 3
```
horse→rorse→rose→ros""",
          "hard", ["dynamic-programming","string"], ["amazon","google","microsoft"],
          "horse ros", "3",
          [{"input":"horse ros","output":"3"},{"input":"intention execution","output":"5"},{"input":"abc abc","output":"0"}],
          ["dp[i][j] = edit distance between word1[:i] and word2[:j].",
           "If chars match: dp[i][j] = dp[i-1][j-1]. Else: dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]).",
           "Base cases: dp[i][0] = i, dp[0][j] = j (deletions/insertions)."],
          "0 <= len(word1), len(word2) <= 500"),

        # ─── MATH / BIT MANIPULATION ──────────────────────────
        p("Missing Number",
          """Given an array with n distinct numbers from 0 to n, find the **missing number**.

**Input:** Space-separated integers
**Output:** Missing number

**Example:**
```
Input: 3 0 1
Output: 2
```""",
          "easy", ["array","math","bit-manipulation","hash-table"], ["amazon","microsoft","google"],
          "3 0 1", "2",
          [{"input":"3 0 1","output":"2"},{"input":"0 1","output":"2"},{"input":"9 6 4 2 3 5 7 0 1","output":"8"}],
          ["Expected sum = n*(n+1)/2. Answer = expected_sum - actual_sum.",
           "XOR approach: XOR all numbers 0..n with all array elements. Result is the missing number.",
          "Use a set and check which number in range(0, n+1) is not in the set."],
          "1 <= n <= 10^4, all numbers are distinct"),

        p("Single Number",
          """Every element appears **twice** except for one. Find that element using O(1) extra space.

**Input:** Space-separated integers
**Output:** Single number

**Example:**
```
Input: 2 2 1
Output: 1
```""",
          "easy", ["array","bit-manipulation"], ["amazon","google","microsoft"],
          "2 2 1", "1",
          [{"input":"2 2 1","output":"1"},{"input":"4 1 2 1 2","output":"4"},{"input":"1","output":"1"}],
          ["XOR of a number with itself is 0. XOR of a number with 0 is the number.",
           "XOR all elements together. Pairs cancel out, leaving the single element.",
           "result = 0; for num in nums: result ^= num; return result"],
          "1 <= n <= 3*10^4, odd n, all nums appear twice except one"),

        p("Power of Two",
          """Determine if a given integer is a **power of 2**.

**Input:** An integer n
**Output:** True or False

**Example:**
```
Input: 16
Output: True
```""",
          "easy", ["math","bit-manipulation","recursion"], ["amazon","google"],
          "16", "True",
          [{"input":"16","output":"True"},{"input":"3","output":"False"},{"input":"1","output":"True"},{"input":"0","output":"False"}],
          ["n > 0 and (n & (n-1)) == 0 is the O(1) bit trick.",
           "A power of 2 in binary has exactly one '1' bit. n & (n-1) clears the lowest set bit.",
           "Alternatively, keep dividing by 2 and check if you reach 1 without remainder."],
          "-2^31 <= n <= 2^31 - 1"),

        p("Happy Number",
          """A happy number eventually reaches 1 by replacing it with the sum of squares of its digits. Detect if n is happy.

**Input:** A positive integer
**Output:** True or False

**Example:**
```
Input: 19
Output: True
```
1² + 9² = 82 → 8²+2²=68 → 6²+8²=100 → 1²+0²+0²=1""",
          "easy", ["math","hash-table","two-pointers"], ["amazon","google"],
          "19", "True",
          [{"input":"19","output":"True"},{"input":"2","output":"False"},{"input":"7","output":"True"}],
          ["Use a set to detect cycles. If you reach a number you've seen before (not 1), it's not happy.",
           "Sum of squares function: sum(int(d)**2 for d in str(n)).",
           "Floyd's cycle detection: use slow (one step) and fast (two steps) pointers."],
          "1 <= n <= 2^31 - 1"),

        p("Count Primes",
          """Count the number of **prime numbers less than n**.

**Input:** An integer n
**Output:** Count of primes < n

**Example:**
```
Input: 10
Output: 4
```
Primes: 2, 3, 5, 7""",
          "medium", ["math","array","sieve-of-eratosthenes"], ["amazon","microsoft"],
          "10", "4",
          [{"input":"10","output":"4"},{"input":"0","output":"0"},{"input":"1","output":"0"},{"input":"100","output":"25"}],
          ["Sieve of Eratosthenes: mark composites by iterating multiples.",
           "Create a boolean array is_prime of size n, initialized to True.",
           "For each i from 2 to sqrt(n), mark all multiples of i as False."],
          "0 <= n <= 5*10^6"),

        p("Reverse Integer",
          """Reverse the digits of a 32-bit signed integer. Return 0 if the result overflows.

**Input:** An integer
**Output:** Reversed integer (0 if overflow)

**Example:**
```
Input: 123
Output: 321
```""",
          "medium", ["math"], ["amazon","microsoft"],
          "123", "321",
          [{"input":"123","output":"321"},{"input":"-123","output":"-321"},{"input":"120","output":"21"},{"input":"1534236469","output":"0"}],
          ["Handle the sign separately.",
           "Reverse digit by digit: result = result*10 + digit.",
           "Check for 32-bit overflow: if result > 2^31-1 or result < -2^31, return 0."],
          "-2^31 <= x <= 2^31 - 1"),

        p("Number of 1 Bits (Hamming Weight)",
          """Count the number of **1 bits** in the binary representation of a positive integer.

**Input:** A positive integer
**Output:** Count of 1 bits

**Example:**
```
Input: 11
Output: 3
```
11 = 1011 in binary → three 1s""",
          "easy", ["bit-manipulation"], ["apple","microsoft"],
          "11", "3",
          [{"input":"11","output":"3"},{"input":"128","output":"1"},{"input":"4294967293","output":"31"},{"input":"7","output":"3"}],
          ["Use bin(n).count('1') for a quick solution.",
           "Bitwise: while n: count += n & 1; n >>= 1.",
           "n & (n-1) clears the lowest set bit. Loop while n != 0."],
          "0 <= n < 2^32"),

        p("Pascal's Triangle Row",
          """Return the **nth row** (0-indexed) of Pascal's Triangle.

**Input:** Row number n
**Output:** Space-separated values

**Example:**
```
Input: 3
Output: 1 3 3 1
```""",
          "easy", ["array","dynamic-programming","math"], ["apple","amazon"],
          "3", "1 3 3 1",
          [{"input":"3","output":"1 3 3 1"},{"input":"5","output":"1 5 10 10 5 1"},{"input":"0","output":"1"},{"input":"1","output":"1 1"}],
          ["Start with [1] and iteratively compute the next row.",
           "Each element is the sum of the two elements above it.",
           "New row: [1] + [row[i]+row[i+1] for i in range(len(row)-1)] + [1]"],
          "0 <= n <= 33"),

        # ─── TREES ────────────────────────────────────────────
        p("Max Depth of Binary Tree",
          """Given a binary tree as **level-order array** (−1 = null), find the maximum depth.

**Input:** Space-separated level-order array
**Output:** Maximum depth

**Example:**
```
Input: 3 9 20 -1 -1 15 7
Output: 3
```
Tree:
```
    3
   / \\
  9  20
    /  \\
   15   7
```""",
          "easy", ["tree","depth-first-search","breadth-first-search","binary-tree"], ["amazon","google","microsoft"],
          "3 9 20 -1 -1 15 7", "3",
          [{"input":"3 9 20 -1 -1 15 7","output":"3"},{"input":"-1","output":"0"},{"input":"1","output":"1"},{"input":"1 2 3 4 5","output":"3"}],
          ["Build the tree from level-order array using a queue/BFS.",
           "Use recursive DFS: depth = 1 + max(dfs(left), dfs(right)).",
           "Or BFS: count levels as you process nodes level by level."],
          "0 <= n <= 10^4, -100 <= node.val <= 100"),

        p("Symmetric Tree",
          """Given a binary tree as **level-order array**, check if it is a **mirror of itself**.

**Input:** Space-separated level-order array (−1 = null)
**Output:** True or False

**Example:**
```
Input: 1 2 2 3 4 4 3
Output: True
```""",
          "easy", ["tree","depth-first-search","breadth-first-search"], ["amazon","microsoft"],
          "1 2 2 3 4 4 3", "True",
          [{"input":"1 2 2 3 4 4 3","output":"True"},{"input":"1 2 2 -1 3 -1 3","output":"False"},{"input":"1","output":"True"}],
          ["A tree is symmetric if left subtree is a mirror of right subtree.",
           "Recursive: isMirror(left, right) checks if left.val == right.val and recursively checks outer and inner pairs.",
           "Iterative: use a queue, enqueue pairs of nodes to compare."],
          "0 <= n <= 1000, -100 <= node.val <= 100"),

        p("Binary Tree Inorder Traversal",
          """Given a binary tree as **level-order array**, return the **inorder traversal** (left, root, right).

**Input:** Space-separated level-order array (−1 = null)
**Output:** Space-separated inorder values

**Example:**
```
Input: 1 -1 2 3
Output: 1 3 2
```""",
          "easy", ["tree","depth-first-search","stack","binary-tree"], ["microsoft","amazon"],
          "1 -1 2 3", "1 3 2",
          [{"input":"1 -1 2 3","output":"1 3 2"},{"input":"-1","output":""},{"input":"1","output":"1"},{"input":"3 1 2","output":"1 3 2"}],
          ["Build tree from level-order, then do recursive inorder traversal.",
           "Iterative: use a stack. Go left until null, then process, then go right.",
           "For level-order build: node i has children at 2i+1 and 2i+2."],
          "0 <= n <= 100, -100 <= node.val <= 100"),

        # ─── GRAPHS ───────────────────────────────────────────
        p("Number of Islands",
          """Count the number of **islands** in a grid (1=land, 0=water). An island is surrounded by water and formed by adjacent (up/down/left/right) land.

**Input:** Line 1 = n m (rows cols), then n rows of space-separated 0s and 1s
**Output:** Number of islands

**Example:**
```
Input:
4 5
1 1 1 1 0
1 1 0 1 0
1 1 0 0 0
0 0 0 0 0
Output: 1
```""",
          "medium", ["array","depth-first-search","breadth-first-search","graph","union-find"], ["amazon","google","microsoft","meta"],
          "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0", "1",
          [{"input":"4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0","output":"1"},{"input":"3 3\n1 1 0\n0 1 0\n0 0 1","output":"2"},{"input":"1 1\n1","output":"1"}],
          ["Use DFS or BFS. When you find a '1', increment count and mark the whole island as visited.",
           "DFS from each unvisited '1': mark it '0' (visited) and recurse to all 4 neighbors.",
           "The number of DFS calls from the main loop = number of islands."],
          "1 <= n, m <= 300"),

        p("Course Schedule",
          """There are n courses (0 to n-1). Some have prerequisites. Can you finish **all courses**?

**Input:** Line 1 = n (courses), Line 2 = m (prerequisites), then m lines "a b" (course a needs b)
**Output:** True or False

**Example:**
```
Input:
2
1
1 0
Output: True
```""",
          "medium", ["depth-first-search","breadth-first-search","graph","topological-sort"], ["amazon","google","microsoft"],
          "2\n1\n1 0", "True",
          [{"input":"2\n1\n1 0","output":"True"},{"input":"2\n2\n1 0\n0 1","output":"False"},{"input":"3\n0","output":"True"}],
          ["This is cycle detection in a directed graph.",
           "Build adjacency list. Use DFS with 3 states: unvisited, in-progress, done.",
           "If you revisit an in-progress node, there's a cycle → False."],
          "1 <= n <= 2000, 0 <= m <= 5000"),

        p("Max Area of Island",
          """Find the **maximum area** of an island in a grid (1=land, 0=water).

**Input:** Line 1 = n m, then n rows of space-separated 0s and 1s
**Output:** Maximum island area (0 if none)

**Example:**
```
Input:
4 5
1 1 0 0 0
1 1 0 0 0
0 0 0 1 1
0 0 0 1 1
Output: 4
```""",
          "medium", ["array","depth-first-search","breadth-first-search","graph"], ["amazon","google"],
          "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 0 1 1\n0 0 0 1 1", "4",
          [{"input":"4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 0 1 1\n0 0 0 1 1","output":"4"},{"input":"1 1\n0","output":"0"},{"input":"1 3\n1 1 1","output":"3"}],
          ["DFS/BFS from each unvisited '1', counting all connected land cells.",
           "DFS returns the size of the island starting from (i,j).",
           "Track the maximum size found."],
          "1 <= n, m <= 50"),

        p("Flood Fill",
          """Perform a **flood fill** starting from position (sr, sc) with new color.

**Input:** Line 1 = n m, next n lines = grid rows, last line = sr sc newColor
**Output:** n rows of the filled grid

**Example:**
```
Input:
3 3
1 1 1
1 1 0
1 0 1
1 1 2
Output:
2 2 2
2 2 0
2 0 1
```""",
          "easy", ["array","depth-first-search","breadth-first-search","matrix"], ["amazon","google"],
          "3 3\n1 1 1\n1 1 0\n1 0 1\n1 1 2", "2 2 2\n2 2 0\n2 0 1",
          [{"input":"3 3\n1 1 1\n1 1 0\n1 0 1\n1 1 2","output":"2 2 2\n2 2 0\n2 0 1"},{"input":"1 1\n0\n0 0 2","output":"2"},{"input":"2 2\n0 0\n0 0\n0 0 0","output":"0 0\n0 0"}],
          ["DFS/BFS from (sr, sc). Replace the original color with new color.",
           "Only fill neighbors with the same original color as (sr,sc).",
           "If original color == new color, no change needed."],
          "1 <= n, m <= 50, 0 <= color < 2^16"),

        # ─── SLIDING WINDOW ───────────────────────────────────
        p("Longest Subarray with Sum ≤ K",
          """Find the length of the **longest contiguous subarray** with sum ≤ k (all elements positive).

**Input:** Line 1 = space-separated positive integers, Line 2 = k
**Output:** Length of longest valid subarray

**Example:**
```
Input:
1 2 3 4 5
7
Output: 3
```
[1,2,3] or [3,4] → max length is 3 (using [1,2,3] or [2,5]→sum=7 also works but length 2)... actually [1,2,3]=6≤7 len=3, [2,3]=5 len=2, [3,4]=7≤7 len=2... hmm [1,2,3,4]=10>7... actually longest is [1,2,3] or [3,4] or [1,2,4] not contiguous. let me pick [1,2,3] len=3""",
          "medium", ["array","sliding-window","two-pointers"], ["amazon","google"],
          "1 2 3 4 5\n7", "3",
          [{"input":"1 2 3 4 5\n7","output":"3"},{"input":"1 1 1 1 1\n3","output":"3"},{"input":"5 1 3\n8","output":"2"}],
          ["Use a sliding window with two pointers left and right.",
           "Expand right, if sum > k shrink from left.",
           "Track max (right - left + 1) while sum <= k."],
          "1 <= n <= 10^5, 1 <= nums[i], k <= 10^9"),

        p("Minimum Size Subarray Sum",
          """Find the length of the **smallest contiguous subarray** with sum ≥ target. Return 0 if impossible.

**Input:** Line 1 = target, Line 2 = space-separated positive integers
**Output:** Minimum length (0 if impossible)

**Example:**
```
Input:
7
2 3 1 2 4 3
Output: 2
```
[4,3] has sum 7 and length 2.""",
          "medium", ["array","sliding-window","binary-search","two-pointers"], ["amazon","google","microsoft"],
          "7\n2 3 1 2 4 3", "2",
          [{"input":"7\n2 3 1 2 4 3","output":"2"},{"input":"4\n1 4 4","output":"1"},{"input":"11\n1 1 1 1 1 1 1 1","output":"0"}],
          ["Sliding window: expand right pointer, shrink left when sum >= target.",
           "Track minimum window length whenever condition is met.",
           "Binary search approach: use prefix sums and binary search."],
          "1 <= target <= 10^9, 1 <= n <= 10^5, 1 <= nums[i] <= 10^4"),

        # ─── SORTING ──────────────────────────────────────────
        p("Merge Intervals",
          """Given a list of intervals, merge all **overlapping intervals**.

**Input:** Line 1 = n, then n lines of "a b"
**Output:** Merged intervals as "a b" separated by newlines

**Example:**
```
Input:
4
1 3
2 6
8 10
15 18
Output:
1 6
8 10
15 18
```""",
          "medium", ["array","sorting"], ["amazon","google","microsoft","meta"],
          "4\n1 3\n2 6\n8 10\n15 18", "1 6\n8 10\n15 18",
          [{"input":"4\n1 3\n2 6\n8 10\n15 18","output":"1 6\n8 10\n15 18"},{"input":"2\n1 4\n4 5","output":"1 5"},{"input":"1\n1 4","output":"1 4"}],
          ["Sort intervals by start time.",
           "Iterate: if current interval overlaps with last merged (start <= last_end), extend last_end.",
           "Otherwise, add as new interval."],
          "1 <= n <= 10^4, 0 <= a <= b <= 10^4"),

        p("Kth Largest Element in Array",
          """Find the **kth largest** element in an unsorted array.

**Input:** Line 1 = space-separated integers, Line 2 = k
**Output:** kth largest element

**Example:**
```
Input:
3 2 1 5 6 4
2
Output: 5
```""",
          "medium", ["array","sorting","heap","quickselect"], ["amazon","google","microsoft"],
          "3 2 1 5 6 4\n2", "5",
          [{"input":"3 2 1 5 6 4\n2","output":"5"},{"input":"3 2 3 1 2 4 5 5 6\n4","output":"4"},{"input":"1\n1","output":"1"}],
          ["Sort and return nums[-k] (O(n log n)).",
           "Use a min-heap of size k. The top is the kth largest.",
           "Quickselect algorithm gives O(n) average time."],
          "1 <= k <= n <= 10^4, -10^4 <= nums[i] <= 10^4"),

        p("Search a 2D Matrix",
          """Given an m×n matrix where rows are sorted and first element of each row > last of previous, search for target.

**Input:** Line 1 = n m, next n lines = matrix rows (space-separated), last line = target
**Output:** True or False

**Example:**
```
Input:
3 4
1 3 5 7
10 11 16 20
23 30 34 60
3
Output: True
```""",
          "medium", ["array","binary-search","matrix"], ["amazon","microsoft"],
          "3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n3", "True",
          [{"input":"3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n3","output":"True"},{"input":"3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n13","output":"False"},{"input":"1 1\n1\n1","output":"True"}],
          ["Treat the 2D matrix as a 1D sorted array: index i → row i//m, col i%m.",
           "Binary search on this virtual 1D array.",
           "Or start from top-right: go left if val>target, go down if val<target."],
          "1 <= n, m <= 100, -10^4 <= matrix[i][j], target <= 10^4"),

        p("Next Permutation",
          """Find the **next lexicographically greater permutation**. If at largest, wrap to smallest.

**Input:** Space-separated integers
**Output:** Next permutation

**Example:**
```
Input: 1 2 3
Output: 1 3 2
```""",
          "medium", ["array","two-pointers"], ["google","amazon","microsoft"],
          "1 2 3", "1 3 2",
          [{"input":"1 2 3","output":"1 3 2"},{"input":"3 2 1","output":"1 2 3"},{"input":"1 1 5","output":"1 5 1"}],
          ["Find the rightmost pair where nums[i] < nums[i+1]. This is the 'pivot'.",
           "Find the rightmost element > pivot. Swap them.",
           "Reverse the suffix after the pivot position."],
          "1 <= n <= 100, 0 <= nums[i] <= 100"),

        p("Spiral Matrix Order",
          """Return all elements of a matrix in **spiral order** (clockwise from top-left).

**Input:** Line 1 = n m, next n lines = matrix rows
**Output:** Space-separated elements in spiral order

**Example:**
```
Input:
3 3
1 2 3
4 5 6
7 8 9
Output: 1 2 3 6 9 8 7 4 5
```""",
          "medium", ["array","matrix","simulation"], ["amazon","google","microsoft"],
          "3 3\n1 2 3\n4 5 6\n7 8 9", "1 2 3 6 9 8 7 4 5",
          [{"input":"3 3\n1 2 3\n4 5 6\n7 8 9","output":"1 2 3 6 9 8 7 4 5"},{"input":"3 4\n1 2 3 4\n5 6 7 8\n9 10 11 12","output":"1 2 3 4 8 12 11 10 9 5 6 7"},{"input":"1 1\n1","output":"1"}],
          ["Use four boundaries: top, bottom, left, right. Shrink as you peel each layer.",
           "Right → Down → Left → Up → repeat.",
           "Collect elements layer by layer."],
          "1 <= n, m <= 10"),
    ]
