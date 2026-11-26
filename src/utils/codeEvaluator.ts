export interface EvaluationResult {
  passed: boolean;
  output: string;
  feedback: string;
  checks: {label: string; ok: boolean}[];
}

function runSandboxedJS(code: string): {ok: boolean; stdout: string; error?: string} {
  const logs: string[] = [];
  const fakeConsole = {
    log: (...args: unknown[]) => {
      logs.push(
        args
          .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
          .join(' ')
      );
    },
  };
  try {
    const fn = new Function('console', `"use strict";\n${code}`);
    fn(fakeConsole);
    return {ok: true, stdout: logs.join('\n')};
  } catch (err) {
    return {
      ok: false,
      stdout: logs.join('\n'),
      error: err instanceof Error ? err.message : 'Runtime error',
    };
  }
}

function stripCommentsAndWhitespace(code: string): string {
  return code
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      return (
        t.length > 0 &&
        !t.startsWith('//') &&
        !t.startsWith('#') &&
        !t.startsWith('--') &&
        !t.startsWith(';') &&
        !t.startsWith('%') &&
        !t.startsWith("'") &&
        !t.startsWith('!') &&
        !t.startsWith('*>') &&
        !t.startsWith('<!--') &&
        !t.startsWith('/*') &&
        !t.startsWith('* ')
      );
    })
    .join('\n')
    .trim();
}

export function evaluateCodeSubmission(params: {
  languageId: string;
  code: string;
  expectedKeywords: string[];
  expectedOutput: string;
}): EvaluationResult {
  const {languageId, code, expectedKeywords} = params;
  const activeCode = stripCommentsAndWhitespace(code);

  if (activeCode.length < 5) {
    return {
      passed: false,
      output: '',
      feedback: 'Write your own solution below the TODO comment before checking.',
      checks: [{label: 'Contains executable code beyond comments', ok: false}],
    };
  }

  // Real in-browser execution for JavaScript
  if (languageId === 'javascript') {
    const res = runSandboxedJS(code);
    const keywordChecks = expectedKeywords.map((kw) => ({
      label: `Uses "${kw}"`,
      ok: activeCode.toLowerCase().includes(kw.toLowerCase()),
    }));
    const hasOutput = res.ok && res.stdout.trim().length > 0;
    const passed = res.ok && keywordChecks.every((c) => c.ok) && hasOutput;

    return {
      passed,
      output: res.error
        ? `Error: ${res.error}`
        : res.stdout || '(No console.log output produced yet)',
      feedback: res.error
        ? `Runtime error: ${res.error}`
        : passed
          ? 'Your JavaScript code executed cleanly and passed all checks.'
          : 'Check your console output or required syntax elements and try again.',
      checks: [
        {label: 'Executes without runtime errors', ok: res.ok},
        ...keywordChecks,
        {label: 'Produces console output', ok: hasOutput},
      ],
    };
  }

  // Structural & syntax check for all other languages (without revealing expected answer)
  const checks = [
    {
      label: 'Contains non-comment implementation',
      ok: activeCode.length >= 8,
    },
    ...expectedKeywords.map((kw) => ({
      label: `Includes ${kw}`,
      ok: activeCode.toLowerCase().includes(kw.toLowerCase()),
    })),
  ];

  const balancedParens =
    (activeCode.match(/\(/g)?.length ?? 0) === (activeCode.match(/\)/g)?.length ?? 0);
  const balancedBraces =
    (activeCode.match(/\{/g)?.length ?? 0) === (activeCode.match(/\}/g)?.length ?? 0);

  checks.push({
    label: 'Balanced parentheses and block delimiters',
    ok: balancedParens && balancedBraces,
  });

  const passed = checks.every((c) => c.ok);

  return {
    passed,
    output: passed
      ? 'Syntax verification complete — your implementation meets all lesson checks.'
      : 'Not verified yet — review the failed check items or ask the AI Tutor for guidance.',
    feedback: passed
      ? 'Well done! Your solution structure and constructs passed.'
      : 'One or more required constructs or syntax delimiters need adjustment.',
    checks,
  };
}
