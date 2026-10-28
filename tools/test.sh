#!/bin/bash
# Run every check against src/app.html. Exit code 0 = safe to build.
#   tools/test.sh          -> syntax + content/engine harnesses (node only, ~1 min)
#   tools/test.sh --smoke  -> also a Playwright click-through of the built page (needs `npm i playwright`, chromium)
set -e
cd "$(dirname "$0")/.."
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
# 1. pull the app script out of the single-file page
python3 - "$T" <<'EOF'
import sys;s=open('src/app.html').read();i=s.rindex('<script>')+8;j=s.rindex('</script>');open(sys.argv[1]+'/full_script.js','w').write(s[i:j])
EOF
node --check "$T/full_script.js" && echo "syntax ........ OK"
cp tools/harness/*.js "$T"/
fail=0
run(){ # name file [grep-for-failure-line]
  out=$(cd "$T" && node "$2" 2>&1) || { echo "$1 ........ CRASH"; echo "$out" | tail -5; fail=1; return; }
  if echo "$out" | grep -qE "$3"; then echo "$1 ........ FAIL"; echo "$out" | tail -8; fail=1; else echo "$1 ........ OK  $(echo "$out" | grep -E "$4" | head -1)"; fi
}
run "matrix/apm   " verify7.js  "FAILURES: [1-9]"            "FAILURES"
run "dealers/boss " verify8.js  "FAILURES: [1-9]"            "boss spawn"
run "content audit" audit.js    "PROBLEMS: [^n]"             "PROBLEMS"
run "scenarios    " scnchk.js   "bad [1-9]"                  "generated"
run "option tells " dupchk.js   "duplicate-option items [1-9]" "correct-is-longest"
run "static tells " statchk2.js "BANK 214 ([4-9][0-9]|[1-9][0-9]{2}) " "BANK"
if [ "$1" = "--smoke" ]; then
  tools/build.sh vtest live >/dev/null
  (python3 -m http.server 8099 >/dev/null 2>&1 &) ; sleep 1
  if node tools/smoke.js http://localhost:8099/index.html; then echo "smoke ......... OK"; else echo "smoke ......... FAIL"; fail=1; fi
  pkill -f "http.server 8099" || true; git checkout -q -- index.html sw.js VERSION 2>/dev/null || true
fi
[ $fail = 0 ] && echo "ALL CHECKS PASSED" || { echo "CHECKS FAILED"; exit 1; }
