set -ex

COVERAGE_LINES=$(jq '.total.lines.pct' ./coverage/coverage-summary.json)
COVERAGE_STATEMENTS=$(jq '.total.statements.pct' ./coverage/coverage-summary.json)
COVERAGE_FUNCTIONS=$(jq '.total.functions.pct' ./coverage/coverage-summary.json)
COVERAGE_BRANCHES=$(jq '.total.branches.pct' ./coverage/coverage-summary.json)
COVERAGE_BRANCHES_TRUE=$(jq '.total.branchesTrue.pct' ./coverage/coverage-summary.json)

if (($(echo "$COVERAGE_LINES < 100" | bc -l))) ||
    (($(echo "$COVERAGE_STATEMENTS < 100" | bc -l))) ||
    (($(echo "$COVERAGE_FUNCTIONS < 100" | bc -l))) ||
    (($(echo "$COVERAGE_BRANCHES < 100" | bc -l))) ||
    (($(echo "$COVERAGE_BRANCHES_TRUE < 100" | bc -l))); then

    echo "One of the coverage metrics is below 100%, failing the workflow."
    exit 1
else
    echo "Test Successful"
fi
