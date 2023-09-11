set -ex

if [ ! -f ./coverage/coverage-summary.json ]; then
    echo "coverage-summary.json does not exist"
    exit 1
fi

COVERAGE_LINES=$(jq '.total.lines.pct' ./coverage/coverage-summary.json)
COVERAGE_STATEMENTS=$(jq '.total.statements.pct' ./coverage/coverage-summary.json)
COVERAGE_FUNCTIONS=$(jq '.total.functions.pct' ./coverage/coverage-summary.json)
COVERAGE_BRANCHES=$(jq '.total.branches.pct' ./coverage/coverage-summary.json)
COVERAGE_BRANCHES_TRUE=$(jq '.total.branchesTrue.pct' ./coverage/coverage-summary.json)

if [ -z "$COVERAGE_LINES" ] ||
    [ -z "$COVERAGE_STATEMENTS" ] ||
    [ -z "$COVERAGE_FUNCTIONS" ] ||
    [ -z "$COVERAGE_BRANCHES" ] ||
    [ -z "$COVERAGE_BRANCHES_TRUE" ]; then
    echo "One of the coverage metrics is missing in the JSON file."
    exit 1
fi

if (($(echo "$COVERAGE_LINES < 100" | bc -l))) ||
    (($(echo "$COVERAGE_STATEMENTS < 100" | bc -l))) ||
    (($(echo "$COVERAGE_FUNCTIONS < 100" | bc -l))) ||
    (($(echo "$COVERAGE_BRANCHES < 100" | bc -l))) ||
    (($(echo "$COVERAGE_BRANCHES_TRUE < 100" | bc -l))); then

    echo "One of the coverage metrics is below 100%, failing the workflow."
    exit 1
fi
