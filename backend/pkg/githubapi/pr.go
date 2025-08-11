package githubapi

import (
	"context"
	"encoding/json"
	"fmt"
	"ghp-copilot/internal/types"
	"io"
	"net/http"
)

func (g GithubApis) GetPullRequest(ctx context.Context, owner, repo, prNumber string) (*types.PullRequest, error) {
	url := fmt.Sprintf("%s/repos/%s/%s/pulls/%s", g.ApiUrl, owner, repo, prNumber)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+g.AuthPat)
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API error: %s", string(body))
	}

	var pr types.PullRequest
	if err := json.NewDecoder(resp.Body).Decode(&pr); err != nil {
		return nil, err
	}
	return &pr, nil
}

func (g GithubApis) GetPullRequests(ctx context.Context, owner, repo string, filters types.PRFilters) ([]types.PullRequest, error) {
	url := fmt.Sprintf("%s/repos/%s/%s/pulls?state=%s&sort=%s&direction=%s&per_page=%s", g.ApiUrl, owner, repo, filters.State, filters.Sort, filters.Direction, filters.PerPage)

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

	var prs []types.PullRequest
	if err := json.NewDecoder(resp.Body).Decode(&prs); err != nil {
		return nil, err
	}
	return prs, nil
}

func (g GithubApis) GetPullRequestFiles(ctx context.Context, owner, repo string, prNumber string) ([]types.PRFile, error) {
	url := fmt.Sprintf("%s/repos/%s/%s/pulls/%s/files", g.ApiUrl, owner, repo, prNumber)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+g.AuthPat)
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API error: %s", string(body))
	}

	var files []types.PRFile
	if err := json.NewDecoder(resp.Body).Decode(&files); err != nil {
		return nil, err
	}
	return files, nil
}
