# AutoHealthCard

吉珠自动填写健康卡

## Secrets:
+ USERNAME

+ PASSWORD

## Usage:

### Method 1: 
1. Create a new repository
2. Copy the .github directory to your own repository and modify auto_health_crad.yml as follows
```diff
- uses: actions/checkout@v2
+ uses: actions/checkout@v2
+ with:
+   repository: ArchFireCoo/AutoHealthCard
```
3. Click Settings -> Secrets
4. Add USERNAME and PASSWORD keys

### Method 2:
1. Fork this repository
2. In your forked repository
3. Click Settings -> Secrets
4. Add USERNAME and PASSWORD keys
5. Configure [Pull](https://github.com/wei/pull) to update your repository whenever upstream updates.

The action will automatically run at 10 and 11am(GMT+8) everyday.
