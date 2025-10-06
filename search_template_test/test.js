// Function to generate random float numbers
function generateRandomFloat() {
  return Math.random() * 1000; // Generate random float between 0 and 1000
}

// Test function 1: x100 Math.round /100
function func1(x) {
  return Math.trunc(x * 100) / 100;
}

// Test function 2: LEFT SHIFT 8 (ignore decimals) RIGHT SHIFT 8
function func2(x) {
  // return Math.trunc(x * 100) / 100;
  // return (Math.floor(x) << 8) >> 8;
  return ((x * 100) | 0) / 100;
}

// Function to measure performance for single function
function measureSingleFunctionPerformance(fn, iterations = 100000) {
  const times = [];
  const totalStartTime = process.hrtime.bigint();

  for (let i = 0; i < iterations; i++) {
    const randomFloat = generateRandomFloat();

    const startTime = process.hrtime.bigint();
    fn(randomFloat);
    const endTime = process.hrtime.bigint();

    times.push(Number(endTime - startTime) / 1000000); // Convert to milliseconds
  }

  const totalEndTime = process.hrtime.bigint();
  const totalTime = Number(totalEndTime - totalStartTime) / 1000000; // Convert to milliseconds

  // Calculate statistics
  times.sort((a, b) => a - b);
  const minTime = times[0];
  const maxTime = times[times.length - 1];
  const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;

  return {
    time: { min: minTime, avg: avgTime, max: maxTime, total: totalTime }
  };
}

// Function to run comparison test
function runComparisonTest(iterations = 10_000_000) {
  console.log(`Running comparison test with ${iterations.toLocaleString()} iterations...`);

  let passCount = 0;
  let failCount = 0;
  const func1Times = [];
  const func2Times = [];
  const failureExamples = [];

  const totalStartTime = process.hrtime.bigint();

  for (let i = 0; i < iterations; i++) {
    const randomFloat = generateRandomFloat();

    // Test func1
    const func1StartTime = process.hrtime.bigint();
    const result1 = func1(randomFloat);
    const func1EndTime = process.hrtime.bigint();
    func1Times.push(Number(func1EndTime - func1StartTime) / 1000000);

    // Test func2
    const func2StartTime = process.hrtime.bigint();
    const result2 = func2(randomFloat);
    const func2EndTime = process.hrtime.bigint();
    func2Times.push(Number(func2EndTime - func2StartTime) / 1000000);

    // Compare results
    if (result1 === result2) {
      passCount++;
    } else {
      failCount++;
      // Collect first 10 failure examples for debugging
      if (failureExamples.length < 5) {
        failureExamples.push({
          input: randomFloat,
          func1Result: result1,
          func2Result: result2,
          iteration: i
        });
      }
    }
  }

  const totalEndTime = process.hrtime.bigint();
  const totalTime = Number(totalEndTime - totalStartTime) / 1000000;

  // Calculate statistics for func1
  func1Times.sort((a, b) => a - b);
  const func1Stats = {
    min: func1Times[0],
    avg: func1Times.reduce((sum, time) => sum + time, 0) / func1Times.length,
    max: func1Times[func1Times.length - 1]
  };

  // Calculate statistics for func2
  func2Times.sort((a, b) => a - b);
  const func2Stats = {
    min: func2Times[0],
    avg: func2Times.reduce((sum, time) => sum + time, 0) / func2Times.length,
    max: func2Times[func2Times.length - 1]
  };

  const passRate = (passCount / iterations) * 100;
  const failRate = (failCount / iterations) * 100;

  console.log(`\nComparison Test Results:`);
  console.log(`  Pass Count: ${passCount.toLocaleString()}`);
  console.log(`  Fail Count: ${failCount.toLocaleString()}`);
  console.log(`  Pass Rate: ${passRate.toFixed(2)}%`);
  console.log(`  Fail Rate: ${failRate.toFixed(2)}%`);
  console.log(`  Total Time: ${totalTime.toFixed(2)} ms`);

  // Debug output for failures
  if (failureExamples.length > 0) {
    console.log(`\nDEBUG: First ${failureExamples.length} failure examples:`);
    failureExamples.forEach((example, index) => {
      console.log(`  ${index + 1}. Input: ${example.input.toFixed(6)}`);
      console.log(`     Func1 (round to 2 decimals): ${example.func1Result}`);
      console.log(`     Func2 (bit shift floor): ${example.func2Result}`);
      console.log(`     Difference: ${Math.abs(example.func1Result - example.func2Result).toFixed(6)}`);
      console.log(`     Iteration: ${example.iteration}`);
      console.log('');
    });

    console.log(`DEBUG: Function behavior analysis:`);
    console.log(`  Func1: Rounds to 2 decimal places (e.g., 123.456 -> 123.46)`);
    console.log(`  Func2: Floors then bit shifts (keeps only integer part, max 255 due to 8-bit shift)`);
    console.log(`  These functions have completely different purposes and will almost never match!`);
    console.log('');
  }

  console.log(`\nFunc1 (x100 Math.round /100) Performance:`);
  console.log(`  Time (ms) - Min: ${func1Stats.min.toFixed(6)}, Avg: ${func1Stats.avg.toFixed(6)}, Max: ${func1Stats.max.toFixed(6)}`);

  console.log(`\nFunc2 (LEFT SHIFT 8 RIGHT SHIFT 8) Performance:`);
  console.log(`  Time (ms) - Min: ${func2Stats.min.toFixed(6)}, Avg: ${func2Stats.avg.toFixed(6)}, Max: ${func2Stats.max.toFixed(6)}`);
  console.log('');
}

// Run the comparison test
runComparisonTest();
