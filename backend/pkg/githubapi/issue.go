package githubapi

import (
	"context"
	"encoding/json"
	"fmt"
	"ghp-copilot/internal/types"
	"io"
	"net/http"
	"strings"
)

func (g GithubApis) GetIssues(ctx context.Context, owner, repo string, filters types.PRFilters) ([]types.Issue, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/issues?state=%s&sort=%s&direction=%s&per_page=%s", owner, repo, filters.State, filters.Sort, filters.Direction, filters.PerPage)

	client := &http.Client{}

	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+g.AuthPat)
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API error: %s", string(body))
	}

	var issues []types.Issue
	if err := json.NewDecoder(resp.Body).Decode(&issues); err != nil {
		return nil, err
	}

	output := []types.Issue{}
	for _, issue := range issues {
		if strings.Contains(issue.HTMLURL, "/issues/") {
			output = append(output, issue)
		}
	}

	return output, nil
}
