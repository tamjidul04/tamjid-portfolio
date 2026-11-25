---
title: "Binary search without off-by-one errors"
date: 2026-11-12
description: "One simple rule that keeps the loop boundaries correct."
tags: ["Algorithms"]
---

Decide what your range means and keep it that way. Here the range includes `lo` and excludes `hi`.

```cpp
int lowerBound(const vector<int>& a, int target) {
    int lo = 0, hi = a.size();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < target) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}
```

It returns the first position whose value is not less than `target`. The array must be sorted.
