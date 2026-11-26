import type {
  ArenaChallenge,
  DrillItem,
  LessonItem,
  ProgrammingLanguage,
} from '../types/learning';
import {LANGUAGES_PART_1, type LanguageBlueprint} from './languagesPart1';
import {LANGUAGES_PART_2} from './languagesPart2';
import {LANGUAGES_PART_3} from './languagesPart3';

interface HelloWorldSpec {
  code: string;
  anatomy: string;
  keywords: string[];
  output: string;
}

function getHelloWorldSpec(bp: LanguageBlueprint): HelloWorldSpec {
  switch (bp.id) {
    case 'python':
      return {
        code: `print("Hello, World!")`,
        anatomy: 'print(...) calls Python’s built-in output function, and the double quotes wrap the text message "Hello, World!".',
        keywords: ['print', 'Hello'],
        output: 'Hello, World!',
      };
    case 'c':
      return {
        code: `#include <stdio.h>\n\nint main(void) {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
        anatomy: '#include <stdio.h> loads standard input/output, main(void) is where the program starts, printf prints the text, and return 0 exits cleanly.',
        keywords: ['printf', 'Hello'],
        output: 'Hello, World!',
      };
    case 'java':
      return {
        code: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
        anatomy: 'Every Java program lives inside a class; the JVM begins executing inside public static void main and prints with System.out.println.',
        keywords: ['System.out.println', 'Hello'],
        output: 'Hello, World!',
      };
    case 'cpp':
      return {
        code: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
        anatomy: '#include <iostream> provides std::cout (standard character output), and << sends "Hello, World!" to the console.',
        keywords: ['std::cout', 'Hello'],
        output: 'Hello, World!',
      };
    case 'csharp':
      return {
        code: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}`,
        anatomy: 'using System imports the base .NET console library, and Console.WriteLine writes a full line of text to the screen.',
        keywords: ['Console.WriteLine', 'Hello'],
        output: 'Hello, World!',
      };
    case 'javascript':
      return {
        code: `console.log("Hello, World!");`,
        anatomy: 'console.log(...) prints messages to the browser developer console or Node.js terminal.',
        keywords: ['console.log', 'Hello'],
        output: 'Hello, World!',
      };
    case 'r':
      return {
        code: `cat("Hello, World!\\n")`,
        anatomy: 'cat(...) outputs clean text without vector index prefixes; \\n adds a newline at the end.',
        keywords: ['cat', 'Hello'],
        output: 'Hello, World!',
      };
    case 'sql':
      return {
        code: `SELECT 'Hello, World!' AS greeting;`,
        anatomy: 'SELECT asks the database engine to return a value; single quotes wrap text literals in SQL, and AS names the output column.',
        keywords: ['SELECT', 'Hello'],
        output: 'greeting: Hello, World!',
      };
    case 'visual-basic':
      return {
        code: `Module HelloWorld\n    Sub Main()\n        Console.WriteLine("Hello, World!")\n    End Sub\nEnd Module`,
        anatomy: 'Sub Main() is the starting procedure inside the Module, and Console.WriteLine prints your message.',
        keywords: ['Console.WriteLine', 'Hello'],
        output: 'Hello, World!',
      };
    case 'go':
      return {
        code: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}`,
        anatomy: 'Executable Go programs start in package main inside func main(), using the fmt package to print text.',
        keywords: ['fmt.Println', 'Hello'],
        output: 'Hello, World!',
      };
    case 'rust':
      return {
        code: `fn main() {\n    println!("Hello, World!");\n}`,
        anatomy: 'fn main() is the entry point of every Rust binary, and println! is a macro (marked by !) that prints text safely.',
        keywords: ['println!', 'Hello'],
        output: 'Hello, World!',
      };
    case 'php':
      return {
        code: `<?php\necho "Hello, World!";\n?>`,
        anatomy: '<?php opens a PHP block and echo outputs text to the HTTP response or CLI terminal.',
        keywords: ['echo', 'Hello'],
        output: 'Hello, World!',
      };
    case 'fortran':
      return {
        code: `program hello\n    print *, "Hello, World!"\nend program hello`,
        anatomy: 'program ... end program wraps the Fortran entry unit, and print *, displays formatted text.',
        keywords: ['print *', 'Hello'],
        output: 'Hello, World!',
      };
    case 'scratch':
      return {
        code: `when green flag clicked\nsay [Hello, World!] for (2) seconds`,
        anatomy: 'Scratch runs blocks top-to-bottom when the green flag event fires, showing speech bubbles via the say block.',
        keywords: ['say', 'Hello'],
        output: 'Sprite says: Hello, World!',
      };
    case 'perl':
      return {
        code: `use strict;\nuse warnings;\nprint "Hello, World!\\n";`,
        anatomy: 'strict and warnings catch common mistakes early, while print writes text followed by a newline.',
        keywords: ['print', 'Hello'],
        output: 'Hello, World!',
      };
    case 'matlab':
      return {
        code: `disp('Hello, World!')`,
        anatomy: 'disp(...) prints arrays or single-quoted character vectors cleanly in the MATLAB command window.',
        keywords: ['disp', 'Hello'],
        output: 'Hello, World!',
      };
    case 'assembly':
      return {
        code: `section .data\n    msg db "Hello, World!", 10\nsection .text\n    global _start\n_start:\n    mov rax, 1\n    mov rdi, 1\n    mov rsi, msg\n    mov rdx, 14\n    syscall`,
        anatomy: 'Assembly loads the write syscall number (1) into rax, file descriptor stdout (1) into rdi, message address into rsi, byte length into rdx, and invokes syscall.',
        keywords: ['mov', 'Hello'],
        output: 'Hello, World!',
      };
    case 'swift':
      return {
        code: `print("Hello, World!")`,
        anatomy: 'Swift runs top-level statements directly in script/main files using print(...) with double-quoted strings.',
        keywords: ['print', 'Hello'],
        output: 'Hello, World!',
      };
    case 'delphi':
      return {
        code: `program HelloWorld;\nbegin\n  WriteLn('Hello, World!');\nend.`,
        anatomy: 'Delphi programs begin between begin ... end. and output single-quoted strings with WriteLn.',
        keywords: ['WriteLn', 'Hello'],
        output: 'Hello, World!',
      };
    case 'dart':
      return {
        code: `void main() {\n  print('Hello, World!');\n}`,
        anatomy: 'Dart always starts execution in void main() and prints either single- or double-quoted text with print().',
        keywords: ['print', 'Hello'],
        output: 'Hello, World!',
      };
    case 'typescript':
      return {
        code: `const greeting: string = "Hello, World!";\nconsole.log(greeting);`,
        anatomy: 'TypeScript adds explicit type annotations like : string on top of JavaScript console.log.',
        keywords: ['console.log', 'Hello'],
        output: 'Hello, World!',
      };
    case 'kotlin':
      return {
        code: `fun main() {\n    println("Hello, World!")\n}`,
        anatomy: 'Kotlin declares functions with fun, starting inside fun main(), and outputs a line with println.',
        keywords: ['println', 'Hello'],
        output: 'Hello, World!',
      };
    case 'ruby':
      return {
        code: `puts "Hello, World!"`,
        anatomy: 'puts ("put string") prints text followed automatically by a newline—clean and readable without boilerplate.',
        keywords: ['puts', 'Hello'],
        output: 'Hello, World!',
      };
    case 'julia':
      return {
        code: `println("Hello, World!")`,
        anatomy: 'Julia scripts execute top-level expressions immediately using println(...) for line output.',
        keywords: ['println', 'Hello'],
        output: 'Hello, World!',
      };
    case 'ada':
      return {
        code: `with Ada.Text_IO; use Ada.Text_IO;\n\nprocedure Hello is\nbegin\n   Put_Line ("Hello, World!");\nend Hello;`,
        anatomy: 'Ada imports Ada.Text_IO explicitly and outputs text inside a named procedure using Put_Line.',
        keywords: ['Put_Line', 'Hello'],
        output: 'Hello, World!',
      };
    case 'cobol':
      return {
        code: `       IDENTIFICATION DIVISION.\n       PROGRAM-ID. HELLO-WORLD.\n       PROCEDURE DIVISION.\n           DISPLAY "Hello, World!".\n           STOP RUN.`,
        anatomy: 'COBOL organizes programs into Divisions; DISPLAY prints output and STOP RUN ends the mainframe job cleanly.',
        keywords: ['DISPLAY', 'Hello'],
        output: 'Hello, World!',
      };
    case 'lua':
      return {
        code: `print("Hello, World!")`,
        anatomy: 'Lua executes lightweight scripts from top to bottom and prints values with print(...).',
        keywords: ['print', 'Hello'],
        output: 'Hello, World!',
      };
    case 'objective-c':
      return {
        code: `#import <Foundation/Foundation.h>\n\nint main(void) {\n    @autoreleasepool {\n        NSLog(@"Hello, World!");\n    }\n    return 0;\n}`,
        anatomy: 'Objective-C uses @"..." for NSString literals and NSLog(...) to log messages to the console.',
        keywords: ['NSLog', 'Hello'],
        output: 'Hello, World!',
      };
    case 'scala':
      return {
        code: `@main def hello(): Unit =\n  println("Hello, World!")`,
        anatomy: 'Scala 3 defines entry points cleanly with @main and prints text with println.',
        keywords: ['println', 'Hello'],
        output: 'Hello, World!',
      };
    case 'haskell':
      return {
        code: `main :: IO ()\nmain = putStrLn "Hello, World!"`,
        anatomy: 'Haskell separates pure calculations from side effects using IO (); putStrLn prints a line to stdout.',
        keywords: ['putStrLn', 'Hello'],
        output: 'Hello, World!',
      };
    case 'bash':
      return {
        code: `#!/usr/bin/env bash\necho "Hello, World!"`,
        anatomy: 'The #! shebang tells Unix which shell runs the script, and echo prints text to standard output.',
        keywords: ['echo', 'Hello'],
        output: 'Hello, World!',
      };
    case 'powershell':
      return {
        code: `Write-Output "Hello, World!"`,
        anatomy: 'PowerShell commands follow Verb-Noun naming—Write-Output sends objects or text into the pipeline.',
        keywords: ['Write-Output', 'Hello'],
        output: 'Hello, World!',
      };
    case 'groovy':
      return {
        code: `println "Hello, World!"`,
        anatomy: 'Groovy simplifies JVM syntax so parentheses around println arguments are even optional.',
        keywords: ['println', 'Hello'],
        output: 'Hello, World!',
      };
    case 'zig':
      return {
        code: `const std = @import("std");\n\npub fn main() void {\n    std.debug.print("Hello, World!\\n", .{});\n}`,
        anatomy: 'Zig imports the standard library explicitly with @import("std") and prints formatted text with .{}.',
        keywords: ['std.debug.print', 'Hello'],
        output: 'Hello, World!',
      };
    case 'lisp':
      return {
        code: `(format t "Hello, World!~%")`,
        anatomy: 'Lisp wraps every operation in parentheses (S-expressions); format t prints to stdout and ~% adds a newline.',
        keywords: ['format', 'Hello'],
        output: 'Hello, World!',
      };
    case 'prolog':
      return {
        code: `:- initialization(main).\nmain :- write('Hello, World!'), nl, halt.`,
        anatomy: 'Prolog executes goals separated by commas: write prints text, nl adds a newline, and halt exits.',
        keywords: ['write', 'Hello'],
        output: 'Hello, World!',
      };
    case 'fsharp':
      return {
        code: `printfn "Hello, World!"`,
        anatomy: 'F# infers types automatically and prints formatted lines cleanly with printfn.',
        keywords: ['printfn', 'Hello'],
        output: 'Hello, World!',
      };
    case 'elixir':
      return {
        code: `IO.puts("Hello, World!")`,
        anatomy: 'Elixir groups standard input/output functions inside the IO module; IO.puts prints a string with a newline.',
        keywords: ['IO.puts', 'Hello'],
        output: 'Hello, World!',
      };
    case 'clojure':
      return {
        code: `(println "Hello, World!")`,
        anatomy: 'Clojure places the function name println first inside parentheses, followed by its string argument.',
        keywords: ['println', 'Hello'],
        output: 'Hello, World!',
      };
    case 'ocaml':
      return {
        code: `print_endline "Hello, World!";;`,
        anatomy: 'print_endline outputs a string plus newline, and ;; ends a top-level expression in the OCaml REPL.',
        keywords: ['print_endline', 'Hello'],
        output: 'Hello, World!',
      };
    case 'vbscript':
      return {
        code: `WScript.Echo "Hello, World!"`,
        anatomy: 'Windows Script Host uses WScript.Echo to print messages directly from .vbs script files.',
        keywords: ['WScript.Echo', 'Hello'],
        output: 'Hello, World!',
      };
    case 'classic-visual-basic':
      return {
        code: `Sub Main()\n    Debug.Print "Hello, World!"\nEnd Sub`,
        anatomy: 'Classic VB procedures sit inside Sub ... End Sub blocks, and Debug.Print writes directly to the Immediate Window.',
        keywords: ['Debug.Print', 'Hello'],
        output: 'Hello, World!',
      };
    case 'abap':
      return {
        code: `REPORT z_hello_world.\nWRITE 'Hello, World!'.`,
        anatomy: 'Every SAP ABAP report begins with REPORT and ends each statement with a period (.); WRITE prints output.',
        keywords: ['WRITE', 'Hello'],
        output: 'Hello, World!',
      };
    case 'sas':
      return {
        code: `data _null_;\n  put "Hello, World!";\nrun;`,
        anatomy: 'A SAS DATA _NULL_ step executes logic without creating a table, using put to write text and run; to execute.',
        keywords: ['put', 'Hello'],
        output: 'Hello, World!',
      };
    case 'plsql':
      return {
        code: `BEGIN\n  DBMS_OUTPUT.PUT_LINE('Hello, World!');\nEND;`,
        anatomy: 'PL/SQL anonymous blocks start with BEGIN, end with END;, and print via Oracle’s DBMS_OUTPUT.PUT_LINE.',
        keywords: ['DBMS_OUTPUT.PUT_LINE', 'Hello'],
        output: 'Hello, World!',
      };
    case 'd':
      return {
        code: `import std.stdio;\n\nvoid main() {\n    writeln("Hello, World!");\n}`,
        anatomy: 'D imports std.stdio for console I/O and starts execution in void main() using writeln.',
        keywords: ['writeln', 'Hello'],
        output: 'Hello, World!',
      };
    case 'ladder-logic':
      return {
        code: `RUNG 1: [| | POWER_ON]---( COIL: HELLO_LAMP )`,
        anatomy: 'Ladder Logic scans rungs left-to-right: when input contact POWER_ON closes, output COIL: HELLO_LAMP energizes.',
        keywords: ['RUNG', 'COIL'],
        output: 'HELLO_LAMP energized',
      };
    case 'caml':
      return {
        code: `print_string "Hello, World!\\n";;`,
        anatomy: 'Caml sends text to standard output with print_string and uses \\n for a newline.',
        keywords: ['print_string', 'Hello'],
        output: 'Hello, World!',
      };
    case 'css':
      return {
        code: `h1 {\n  color: #2563eb;\n  font-size: 32px;\n}`,
        anatomy: 'CSS selects an HTML element (h1) and applies property-value declarations inside curly braces { ... }.',
        keywords: ['color:', '{'],
        output: 'Styles the h1 "Hello, World!" heading in blue at 32px',
      };
    case 'html':
      return {
        code: `<!DOCTYPE html>\n<html>\n  <body>\n    <h1>Hello, World!</h1>\n  </body>\n</html>`,
        anatomy: 'HTML wraps webpage content in tags: <html> is the root, <body> holds visible elements, and <h1> creates the main heading.',
        keywords: ['<h1>', 'Hello'],
        output: 'Displays a large "Hello, World!" heading in the browser',
      };
    default:
      return {
        code: bp.helloCode,
        anatomy: `Notice how "${bp.varKeyword}" sends your first message to the output stream.`,
        keywords: [bp.varKeyword],
        output: bp.helloOutput,
      };
  }
}

function commentSyntax(id: string): {prefix: string; exampleLine: (msg: string) => string} {
  switch (id) {
    case 'python':
    case 'r':
    case 'ruby':
    case 'perl':
    case 'julia':
    case 'bash':
    case 'powershell':
    case 'elixir':
      return {prefix: '#', exampleLine: (m) => `# ${m}`};
    case 'sql':
    case 'plsql':
    case 'haskell':
    case 'lua':
    case 'ada':
      return {prefix: '--', exampleLine: (m) => `-- ${m}`};
    case 'visual-basic':
    case 'vbscript':
    case 'classic-visual-basic':
      return {prefix: "'", exampleLine: (m) => `' ${m}`};
    case 'matlab':
    case 'prolog':
      return {prefix: '%', exampleLine: (m) => `% ${m}`};
    case 'fortran':
      return {prefix: '!', exampleLine: (m) => `! ${m}`};
    case 'cobol':
      return {prefix: '*>', exampleLine: (m) => `       *> ${m}`};
    case 'abap':
      return {prefix: '"', exampleLine: (m) => `" ${m}`};
    case 'sas':
      return {prefix: '/*', exampleLine: (m) => `/* ${m} */`};
    case 'css':
      return {prefix: '/*', exampleLine: (m) => `/* ${m} */`};
    case 'html':
      return {prefix: '<!--', exampleLine: (m) => `<!-- ${m} -->`};
    case 'assembly':
    case 'lisp':
    case 'clojure':
      return {prefix: ';', exampleLine: (m) => `; ${m}`};
    case 'ocaml':
    case 'caml':
      return {prefix: '(*', exampleLine: (m) => `(* ${m} *)`};
    default:
      return {prefix: '//', exampleLine: (m) => `// ${m}`};
  }
}

function buildCommentLessonCode(bp: LanguageBlueprint, hello: HelloWorldSpec): string {
  const cs = commentSyntax(bp.id);
  if (bp.id === 'bash') {
    return `#!/usr/bin/env bash\n# This note explains the line below without running\necho "Hello, World!"`;
  }
  return `${cs.exampleLine(`My first ${bp.name} note — ignored at runtime`)}\n${hello.code}`;
}

function buildTypesLessonCode(bp: LanguageBlueprint): string {
  switch (bp.id) {
    case 'html':
      return `<h1>Profile</h1>\n<p>Age: 21 | Active: true</p>`;
    case 'css':
      return `.card {\n  width: 320px;        /* length with px unit */\n  opacity: 0.95;       /* decimal number */\n  color: #0f172a;      /* hex color */\n}`;
    case 'sql':
      return `SELECT 'Ada' AS learner_name, 10 AS free_lessons, TRUE AS active;`;
    case 'ladder-logic':
      return `// BOOL contact (0/1) vs INT preset counter\nRUNG 1: [| | SENSOR_BOOL]---( CTU: BOX_COUNT, PV=10 )`;
    default:
      return bp.helloCode;
  }
}

function buildArithmeticLessonCode(bp: LanguageBlueprint): string {
  switch (bp.id) {
    case 'html':
      return `<article>\n  <h2>Monthly vs Yearly Plan</h2>\n  <p>12 months at 5,000 NGN = 60,000 NGN</p>\n</article>`;
    case 'css':
      return `.panel {\n  width: calc(100% - 32px);\n  padding: 16px;\n}`;
    case 'sql':
      return `SELECT 5000 * 12 AS yearly_naira, 10 + 4 AS total_lessons;`;
    case 'ladder-logic':
      return `RUNG 1: [| | CALC_ENABLE]---[ ADD: SOURCE_A=5, SOURCE_B=10, DEST=SUM_OUT ]`;
    default:
      return bp.funcCode;
  }
}

function buildConditionalLessonCode(bp: LanguageBlueprint): string {
  switch (bp.id) {
    case 'html':
      return `<section aria-live="polite">\n  <p hidden>Hidden notice</p>\n  <p>Visible status: Ready to code</p>\n</section>`;
    case 'css':
      return `.lesson-card:hover {\n  border-color: #2563eb;\n}\n@media (min-width: 768px) {\n  .lesson-card { padding: 24px; }\n}`;
    case 'sql':
      return `SELECT name, score\nFROM learners\nWHERE score >= 70;`;
    default:
      return bp.loopCode;
  }
}

function buildLessons(bp: LanguageBlueprint): LessonItem[] {
  const slug = bp.id;
  const cs = commentSyntax(bp.id);
  const c = cs.prefix;
  const hello = getHelloWorldSpec(bp);

  return [
    {
      id: `${slug}-l1`,
      index: 1,
      title: `What is ${bp.name}? Your First "Hello, World!"`,
      level: 'Beginner',
      isFree: true,
      summary: `Understand what ${bp.name} is built for and write your very first "Hello, World!" from scratch.`,
      explanation: [
        `${bp.name} (introduced in ${bp.year}) is a ${bp.paradigm.toLowerCase()} language stored in ${bp.fileExt} files. ${bp.tagline}`,
        `Before variables, loops, or complex logic, every programmer starts with "Hello, World!" to verify how output works. ${hello.anatomy}`,
      ],
      codeExample: hello.code,
      keyTakeaway: `Write "${hello.keywords[0]}" carefully and wrap text cleanly—your first working "Hello, World!" proves your syntax foundation.`,
      exercise: {
        prompt: `Write a fresh ${bp.name} "Hello, World!" example from scratch using ${hello.keywords[0]}.`,
        starterCode: `${c} TODO: Write your first "Hello, World!" in ${bp.name} below\n`,
        expectedKeywords: hello.keywords,
        expectedOutput: hello.output,
        hint: `Study how the example above uses ${hello.keywords[0]} to display "Hello, World!".`,
      },
    },
    {
      id: `${slug}-l2`,
      index: 2,
      title: `Comments & Reading ${bp.name} Code Line by Line`,
      level: 'Beginner',
      isFree: true,
      summary: `Add human-readable notes using ${bp.name} comments and trace execution order.`,
      explanation: [
        `Comments are notes inside source files meant purely for human readers—the compiler, interpreter, or browser skips them completely.`,
        `In ${bp.name}, comments start with "${c}" (${cs.exampleLine('like this')}). Programmers read and execute lines from top to bottom, using comments to explain why a step exists.`,
      ],
      codeExample: buildCommentLessonCode(bp, hello),
      keyTakeaway: `Use brief "${c}" comments to clarify intent rather than repeating obvious code.`,
      exercise: {
        prompt: `Add a helpful comment line in ${bp.name}, then write an instruction using ${hello.keywords[0]}.`,
        starterCode: `${c} TODO: Write a short comment on the next line, then output a greeting with ${hello.keywords[0]}\n`,
        expectedKeywords: [hello.keywords[0]],
        expectedOutput: hello.output,
        hint: `Start a note with "${c}" and include "${hello.keywords[0]}" on a non-comment line below it.`,
      },
    },
    {
      id: `${slug}-l3`,
      index: 3,
      title: `Variables — Storing Your First Values in ${bp.name}`,
      level: 'Beginner',
      isFree: true,
      summary: `Give meaningful names to values using ${bp.name} bindings (${bp.varExample}).`,
      explanation: [
        `Once you can print fixed text, the next building block is storing data in memory so your program can reuse or update it later.`,
        `In ${bp.name}, declarations such as "${bp.varExample}" assign a label to a value, which you can then inspect with ${bp.varKeyword}.`,
      ],
      codeExample: bp.helloCode,
      keyTakeaway: `Choose descriptive variable names and match ${bp.name}'s exact binding syntax (${bp.varExample}).`,
      exercise: {
        prompt: `Create or bind a named value in ${bp.name} and output it using ${bp.varKeyword}.`,
        starterCode: `${c} TODO: Declare/bind a value (${bp.varExample}) and output it using ${bp.varKeyword}\n`,
        expectedKeywords: [bp.varKeyword],
        expectedOutput: bp.helloOutput,
        hint: `Store a value first, then pass it to ${bp.varKeyword}.`,
      },
    },
    {
      id: `${slug}-l4`,
      index: 4,
      title: `Core Data Types (Text, Numbers & Values) in ${bp.name}`,
      level: 'Beginner',
      isFree: true,
      summary: `Distinguish text strings, numbers, and state values cleanly in ${bp.name}.`,
      explanation: [
        `Computers treat text ("Hello"), whole or decimal numbers (42, 3.5), and true/false flags differently because each type supports different operations.`,
        `Observe how ${bp.name} represents text versus numeric or state values so you never mix incompatible types by mistake.`,
      ],
      codeExample: buildTypesLessonCode(bp),
      keyTakeaway: `Always match quotes for text values and numeric formats for quantities in ${bp.name}.`,
      exercise: {
        prompt: `Write a ${bp.name} snippet combining text and numeric or state values with ${bp.varKeyword}.`,
        starterCode: `${c} TODO: Define both a text value and a number/state value, then output with ${bp.varKeyword}\n`,
        expectedKeywords: [bp.varKeyword],
        expectedOutput: bp.helloOutput,
        hint: `Review how the example pairs text labels with numeric or status values.`,
      },
    },
    {
      id: `${slug}-l5`,
      index: 5,
      title: `Arithmetic, Operators & Expressions in ${bp.name}`,
      level: 'Beginner',
      isFree: true,
      summary: `Compute totals, differences, and expressions in ${bp.name}.`,
      explanation: [
        `Software constantly transforms numbers—adding scores, multiplying monthly fees by 12, or dividing averages.`,
        `Study how ${bp.name} writes arithmetic expressions and outputs the calculated result.`,
      ],
      codeExample: buildArithmeticLessonCode(bp),
      keyTakeaway: `Group multi-step expressions with parentheses when order of operations matters.`,
      exercise: {
        prompt: `Write a ${bp.name} expression that calculates a numeric value (like multiplying or adding two numbers) and outputs it.`,
        starterCode: `${c} TODO: Compute a calculation in ${bp.name} and display it with ${bp.varKeyword}\n`,
        expectedKeywords: [bp.varKeyword],
        expectedOutput: bp.funcOutput,
        hint: `Combine two numbers with + or * and output the result using ${bp.varKeyword}.`,
      },
    },
    {
      id: `${slug}-l6`,
      index: 6,
      title: `Working with Text, Strings & Labels in ${bp.name}`,
      level: 'Beginner',
      isFree: true,
      summary: `Combine strings, build labels, and format readable messages in ${bp.name}.`,
      explanation: [
        `Real applications greet learners by name, format invoices, and assemble clear labels from smaller text pieces.`,
        `Notice how ${bp.name} quotes strings and joins or formats dynamic text inside output.`,
      ],
      codeExample: bp.helloCode,
      keyTakeaway: `Check whether ${bp.name} uses single quotes, double quotes, or string-joining operators.`,
      exercise: {
        prompt: `Create a formatted greeting or course label in ${bp.name} and output it with ${bp.varKeyword}.`,
        starterCode: `${c} TODO: Format a custom text message and display it with ${bp.varKeyword}\n`,
        expectedKeywords: [bp.varKeyword],
        expectedOutput: bp.helloOutput,
        hint: `Wrap your text carefully in ${bp.name} quotes and output it via ${bp.varKeyword}.`,
      },
    },
    {
      id: `${slug}-l7`,
      index: 7,
      title: `Making Decisions with Conditionals in ${bp.name}`,
      level: 'Beginner',
      isFree: true,
      summary: `Control when rules or branches run based on conditions in ${bp.name}.`,
      explanation: [
        `Programs become smart when they inspect a condition—such as whether a score passes or a screen is wide—and choose the right branch.`,
        `Pay close attention to comparison symbols (>=, =, ==) and how ${bp.name} marks the start and end of conditional blocks.`,
      ],
      codeExample: buildConditionalLessonCode(bp),
      keyTakeaway: `Keep condition rules explicit and test both passing and non-passing cases.`,
      exercise: {
        prompt: `Write a ${bp.name} conditional rule or comparison check that produces output with ${bp.varKeyword}.`,
        starterCode: `${c} TODO: Write a conditional check in ${bp.name} and output a clear result\n`,
        expectedKeywords: [bp.varKeyword],
        expectedOutput: bp.loopOutput,
        hint: `Compare a value against a threshold and output a message using ${bp.varKeyword}.`,
      },
    },
    {
      id: `${slug}-l8`,
      index: 8,
      title: `Loops & Repeating Actions in ${bp.name}`,
      level: 'Beginner',
      isFree: true,
      summary: `Automate repeated tasks cleanly without copying and pasting code in ${bp.name}.`,
      explanation: [
        `Instead of writing the same line ten times, loops repeat an instruction block across a range or list of items.`,
        `Trace the starting condition, body, and ending boundary in this ${bp.name} loop example.`,
      ],
      codeExample: bp.loopCode,
      keyTakeaway: `Every loop must advance toward a stopping condition so it finishes cleanly.`,
      exercise: {
        prompt: `Write a repeating loop or multi-item block in ${bp.name} using ${bp.loopKeywords.join(' and ')}.`,
        starterCode: `${c} TODO: Implement a loop or repeated block in ${bp.name} using ${bp.loopKeywords[0]}\n`,
        expectedKeywords: bp.loopKeywords,
        expectedOutput: bp.loopOutput,
        hint: `Include ${bp.loopKeywords.join(' and ')} just like the lesson example above.`,
      },
    },
    {
      id: `${slug}-l9`,
      index: 9,
      title: `Functions & Reusable Blocks in ${bp.name}`,
      level: 'Beginner',
      isFree: true,
      summary: `Package behavior into named reusable functions, rules, or procedures in ${bp.name}.`,
      explanation: [
        `Once a calculation or layout pattern works, wrapping it in a named reusable block prevents duplication and makes bugs easy to isolate.`,
        `Look at how ${bp.name} defines inputs (parameters), performs work, and returns or applies the result.`,
      ],
      codeExample: bp.funcCode,
      keyTakeaway: `Give each function or reusable rule one clear job and a descriptive name.`,
      exercise: {
        prompt: `Define and use a reusable block or function in ${bp.name} featuring ${bp.funcKeywords.join(' and ')}.`,
        starterCode: `${c} TODO: Write a reusable block/function in ${bp.name} using ${bp.funcKeywords[0]}\n`,
        expectedKeywords: [bp.funcKeywords[0]],
        expectedOutput: bp.funcOutput,
        hint: `Begin with "${bp.funcKeywords[0]}" as modeled in the example.`,
      },
    },
    {
      id: `${slug}-l10`,
      index: 10,
      title: `Ordered Lists, Arrays & Collections in ${bp.name}`,
      level: 'Beginner',
      isFree: true,
      summary: `Group related items together in collections, arrays, tables, or containers in ${bp.name}.`,
      explanation: [
        `Real-world programs handle rosters of learners, lists of prices, or tables of records rather than single standalone values.`,
        `Study how ${bp.name} constructs a collection and reads or transforms its elements.`,
      ],
      codeExample: bp.dataCode,
      keyTakeaway: `Verify whether ${bp.name} indexes items starting at 0 or 1 and keep collections well-structured.`,
      exercise: {
        prompt: `Create a collection or structured container in ${bp.name} using ${bp.dataKeywords[0]}.`,
        starterCode: `${c} TODO: Build a ${bp.name} collection using ${bp.dataKeywords[0]} and display an item\n`,
        expectedKeywords: [bp.dataKeywords[0]],
        expectedOutput: bp.dataOutput,
        hint: `Look at how the example organizes multiple values with ${bp.dataKeywords[0]}.`,
      },
    },
    {
      id: `${slug}-l11`,
      index: 11,
      title: `Structured Records & Key-Value Lookups in ${bp.name}`,
      level: 'Intermediate',
      isFree: false,
      summary: `Model named fields and structured entries cleanly in ${bp.name}.`,
      explanation: [
        `When records hold multiple attributes—such as a student's name, plan, and score—structured types and key-value maps keep code self-documenting.`,
        `Examine how ${bp.name} accesses fields safely across structured containers.`,
      ],
      codeExample: bp.dataCode,
      keyTakeaway: `Structured records prevent positional mistakes as your codebase grows.`,
      exercise: {
        prompt: `Model a structured group of items in ${bp.name} using ${bp.dataKeywords.join(' and ')}.`,
        starterCode: `${c} TODO: Create a structured collection using ${bp.dataKeywords.join(', ')}\n`,
        expectedKeywords: bp.dataKeywords,
        expectedOutput: bp.dataOutput,
        hint: `Include ${bp.dataKeywords.join(' and ')} in your solution.`,
      },
    },
    {
      id: `${slug}-l12`,
      index: 12,
      title: `Modular Composition & Helper Pipelines in ${bp.name}`,
      level: 'Intermediate',
      isFree: false,
      summary: `Connect small focused helpers into clean multi-step ${bp.name} workflows.`,
      explanation: [
        `Intermediate developers break multi-step logic into composable pieces that pass outputs cleanly from one stage to the next.`,
        `Review how ${bp.name} structures reusable helper signatures and parameters.`,
      ],
      codeExample: bp.funcCode,
      keyTakeaway: `Small composable units are far easier to test and extend than monolithic blocks.`,
      exercise: {
        prompt: `Compose a clean multi-step helper or reusable definition in ${bp.name} using ${bp.funcKeywords.join(' and ')}.`,
        starterCode: `${c} TODO: Compose a helper in ${bp.name} using ${bp.funcKeywords.join(', ')}\n`,
        expectedKeywords: bp.funcKeywords,
        expectedOutput: bp.funcOutput,
        hint: `Include ${bp.funcKeywords.join(' and ')} cleanly.`,
      },
    },
    {
      id: `${slug}-l13`,
      index: 13,
      title: `Defensive Error & Edge-Case Safety in ${bp.name}`,
      level: 'Advanced',
      isFree: false,
      summary: `Guard against invalid inputs, missing values, and boundary failures in ${bp.name}.`,
      explanation: [
        `Production ${bp.name} code anticipates edge cases—empty inputs, invalid types, division by zero, or small viewports—before they break user experience.`,
        `Study how ${bp.name} handles edge cases explicitly and safely.`,
      ],
      codeExample: bp.advancedCode,
      keyTakeaway: `Handle unexpected inputs gracefully at system boundaries.`,
      exercise: {
        prompt: `Implement a defensive guard or advanced pattern in ${bp.name} using ${bp.advancedKeywords.join(' and ')}.`,
        starterCode: `${c} TODO: Add defensive/advanced handling using ${bp.advancedKeywords.join(', ')}\n`,
        expectedKeywords: bp.advancedKeywords,
        expectedOutput: bp.advancedOutput,
        hint: `Use ${bp.advancedKeywords.join(' and ')} to handle edge cases cleanly.`,
      },
    },
    {
      id: `${slug}-l14`,
      index: 14,
      title: `Idiomatic Architecture & Mastery in ${bp.name}`,
      level: 'Advanced',
      isFree: false,
      summary: `Bring together ${bp.name}'s signature idioms in a clean capstone implementation.`,
      explanation: [
        `Mastery means writing ${bp.name} code that is concise, predictable, and idiomatic for experienced engineers in this ecosystem.`,
        `Apply the advanced constructs below to build a polished capstone solution from scratch.`,
      ],
      codeExample: bp.advancedCode,
      keyTakeaway: `Idiomatic ${bp.name} balances clarity, safety, and maintainable structure.`,
      exercise: {
        prompt: `Write a capstone ${bp.name} snippet applying ${bp.advancedKeywords.join(' and ')}.`,
        starterCode: `${c} TODO: Build an idiomatic ${bp.name} capstone solution\n`,
        expectedKeywords: bp.advancedKeywords,
        expectedOutput: bp.advancedOutput,
        hint: `Combine ${bp.advancedKeywords.join(' and ')} cleanly.`,
      },
    },
  ];
}

function uniqueChoices(correct: string, candidates: string[]): string[] {
  const seen = new Set<string>([correct]);
  const wrongs: string[] = [];
  for (const c of candidates) {
    if (!seen.has(c)) {
      seen.add(c);
      wrongs.push(c);
    }
    if (wrongs.length === 3) break;
  }
  const fallbacks = ['None of the above', 'Compilation error', 'Undefined behavior', '0'];
  for (const fb of fallbacks) {
    if (wrongs.length === 3) break;
    if (!seen.has(fb)) {
      seen.add(fb);
      wrongs.push(fb);
    }
  }
  return [correct, ...wrongs];
}

function buildDrills(bp: LanguageBlueprint): DrillItem[] {
  const slug = bp.id;
  const outputOptions = uniqueChoices(bp.drillOutput1, bp.drillWrong1);
  const blankOptions = uniqueChoices(bp.drillBlankAnswer, bp.drillBlankWrong);
  const bugOptions = uniqueChoices(bp.drillBugAnswer, bp.drillBugWrong);

  const funcOutClean = bp.funcOutput.trim();
  const numericVal = Number(funcOutClean);
  const funcWrongCandidates = Number.isFinite(numericVal) && funcOutClean !== ''
    ? [String(numericVal + 7), String(Math.max(0, numericVal - 4)), String(numericVal * 2 + 1)]
    : ['0', 'null', 'Syntax error'];
  const funcOptions = uniqueChoices(funcOutClean, funcWrongCandidates);

  const loopSingleLine = bp.loopOutput
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join(' | ');
  const loopLines = bp.loopOutput
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const loopWrongCandidates = [
    loopLines.slice().reverse().join(' | '),
    loopLines.length > 0 ? `${loopLines[0]} (prints once)` : 'Prints once',
    'Skips the body completely',
  ];
  const loopOptions = uniqueChoices(loopSingleLine, loopWrongCandidates);

  const advConstruct = bp.advancedKeywords.join(' + ');
  const advWrongCandidates = [
    'goto + label',
    'yield + sleep',
    'malloc + free',
    'import + export',
    'switch + break',
  ];
  const advOptions = uniqueChoices(advConstruct, advWrongCandidates);

  const rotate = <T,>(arr: T[], shift: number): {items: T[]; correctIdx: number} => {
    const s = shift % arr.length;
    const items = arr.map((_, i) => arr[(i - s + arr.length) % arr.length]);
    return {items, correctIdx: s};
  };

  const r1 = rotate(outputOptions, bp.rank);
  const r2 = rotate(blankOptions, bp.rank + 1);
  const r3 = rotate(bugOptions, bp.rank + 2);
  const r4 = rotate(funcOptions, bp.rank + 1);
  const r5 = rotate(loopOptions, bp.rank + 2);
  const r6 = rotate(advOptions, bp.rank + 3);

  const section1Title = 'Section 1: Core Syntax & Output';
  const section2Title = 'Section 2: Applied Logic & Patterns';

  return [
    {
      id: `${slug}-d1`,
      section: 1,
      sectionTitle: section1Title,
      title: `${bp.name} Output Prediction`,
      type: 'output',
      prompt: `Read this ${bp.name} snippet carefully. What does it output or evaluate to?`,
      codeSnippet: bp.drillSnippet1,
      options: r1.items,
      correctIndex: r1.correctIdx,
      explanation: `In ${bp.name}, evaluating this snippet produces: ${bp.drillOutput1}.`,
    },
    {
      id: `${slug}-d2`,
      section: 1,
      sectionTitle: section1Title,
      title: `${bp.name} Syntax Fill-in`,
      type: 'fill-blank',
      prompt: bp.drillBlankPrompt,
      codeSnippet: bp.drillBlankCode,
      options: r2.items,
      correctIndex: r2.correctIdx,
      explanation: `"${bp.drillBlankAnswer}" is the exact ${bp.name} syntax token required here.`,
    },
    {
      id: `${slug}-d3`,
      section: 1,
      sectionTitle: section1Title,
      title: `${bp.name} Bug Spotter`,
      type: 'debug',
      prompt: `Spot the defect or runtime behavior in this ${bp.name} code fragment:`,
      codeSnippet: bp.drillBugCode,
      options: r3.items,
      correctIndex: r3.correctIdx,
      explanation: bp.drillBugAnswer,
    },
    {
      id: `${slug}-d4`,
      section: 2,
      sectionTitle: section2Title,
      title: `${bp.name} Block & Function Trace`,
      type: 'output',
      prompt: `Trace this ${bp.name} block below. What result does it produce?`,
      codeSnippet: bp.funcCode,
      options: r4.items,
      correctIndex: r4.correctIdx,
      explanation: `Evaluating this block yields: ${funcOutClean}.`,
    },
    {
      id: `${slug}-d5`,
      section: 2,
      sectionTitle: section2Title,
      title: `${bp.name} Iteration & Structure`,
      type: 'output',
      prompt: `Follow this ${bp.name} structure step by step. What sequence or layout results?`,
      codeSnippet: bp.loopCode,
      options: r5.items,
      correctIndex: r5.correctIdx,
      explanation: `Executing in order produces: ${loopSingleLine}.`,
    },
    {
      id: `${slug}-d6`,
      section: 2,
      sectionTitle: section2Title,
      title: `${bp.name} Pattern Recognition`,
      type: 'fill-blank',
      prompt: `Which ${bp.name} constructs or keywords power this advanced pattern?`,
      codeSnippet: bp.advancedCode,
      options: r6.items,
      correctIndex: r6.correctIdx,
      explanation: `This pattern relies on "${advConstruct}" in ${bp.name}.`,
    },
  ];
}

function buildArena(bp: LanguageBlueprint): ArenaChallenge[] {
  const slug = bp.id;
  const cs = commentSyntax(bp.id);
  return [
    {
      id: `${slug}-a1`,
      title: `${bp.name} Starter Sprint`,
      difficulty: 'Starter',
      isFree: true,
      timeLimitMinutes: 10,
      description: bp.arenaPrompt,
      requirements: [
        `Write clean, idiomatic ${bp.name} (${bp.fileExt}) syntax.`,
        `Include required constructs: ${bp.arenaKeywords.join(', ')}.`,
      ],
      starterCode: `${cs.exampleLine(`TODO: Implement your ${bp.name} Starter Sprint solution here`)}\n`,
      sampleInput: 'Standard test fixture',
      expectedOutput: bp.arenaExpected,
      validationKeywords: bp.arenaKeywords,
    },
    {
      id: `${slug}-a2`,
      title: `${bp.name} Mastery Challenge`,
      difficulty: 'Mastery',
      isFree: false,
      timeLimitMinutes: 15,
      description: bp.arenaProPrompt,
      requirements: [
        `Solve using production ${bp.name} patterns.`,
        `Use key constructs: ${bp.arenaProKeywords.join(', ')}.`,
      ],
      starterCode: `${cs.exampleLine(`TODO: Implement your ${bp.name} Mastery Challenge solution here`)}\n`,
      sampleInput: 'Extended edge-case fixture',
      expectedOutput: bp.arenaProExpected,
      validationKeywords: bp.arenaProKeywords,
    },
  ];
}

const ALL_BLUEPRINTS: LanguageBlueprint[] = [
  ...LANGUAGES_PART_1,
  ...LANGUAGES_PART_2,
  ...LANGUAGES_PART_3,
];

export const PROGRAMMING_LANGUAGES: ProgrammingLanguage[] = ALL_BLUEPRINTS.map(
  (bp) => ({
    rank: bp.rank,
    id: bp.id,
    name: bp.name,
    category: bp.category,
    year: bp.year,
    paradigm: bp.paradigm,
    tagline: bp.tagline,
    fileExt: bp.fileExt,
    lessons: buildLessons(bp),
    drills: buildDrills(bp),
    arena: buildArena(bp),
  })
);

export function getLanguageById(id: string): ProgrammingLanguage | undefined {
  return PROGRAMMING_LANGUAGES.find((l) => l.id === id);
}
