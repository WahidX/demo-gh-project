package llm

import (
	"context"
	"fmt"
	"ghp-copilot/pkg/githubapi"
)

func SummarizePRChanges(ctx context.Context, prTitle, prBody string, files []githubapi.PRFile) (string, error) {
	prompt := fmt.Sprintf(`
You are an expert code reviewer. Summarize the following GitHub Pull Request in a crisp, structured, and easy-to-grasp way. Your audience is a person who knows little bit coding. So you have to tell What the author is changing in each file logically. Use bullet points, tables, or other clear structures. Avoid long paragraphs. Highlight key changes per affected files and any important context. Don't just tell that lines added or deleted.
PR Title: %s
PR Description: %s
Changed Files: %s

In your response there will be exactly two parts:
1. Summary - (in the response format ## Summary part) Brief summary of the changes done in the PR.
2. File wise change summary - (in the table) Here will be 3 columns, i) file name, ii) +a<no of additions> -<no of deletions> iii) Key Changes: Summary of the changes done in that particular file.
For each file, summarize the main changes. If possible, group similar changes.

The response format (in md format):

## Summary
paragraph of short description in your language

| file name | file changes | Key Changes |
|-----------|--------------|----------|
| Row 1 C1  |   +a -b      | eg. Printing 'something', Updated crond job frequency. Added logic to handle Invited user signup. |
`, prTitle, prBody, fmt.Sprintf("%+v", files))

	fmt.Println("prompt: ", prompt)
	resp, err := llmModel.Call(ctx, prompt)
	if err != nil {
		return "", fmt.Errorf("LLM call failed: %w", err)
	}
	return resp, nil
}

func BaseQuery(ctx context.Context, query string) (response string, err error) {
	predefinedInstruction := "Answer the below query briefly using less words. Also be fast.\n"

	response, err = llmModel.Call(ctx, predefinedInstruction+query)
	if err != nil {
		err = fmt.Errorf("LLM call failed: %w", err)
	}
	return response, err
}
