export interface CommitInfo {
    hash: string;
    author: string;
    date: string;
    message: string;
    diff?: string;
    filename?: string;
}

export interface PullRequestInfo {
    number: number;
    title: string;
    body: string;
    author: string;
    url: string;
    createdAt: string;
    mergedAt: string;
    comments: PullRequestComment[];
    linkedIssues: LinkedIssue[];
}

export interface PullRequestComment {
    author: string;
    body: string;
    createdAt: string;
}

export interface LinkedIssue {
    number: number;
    title: string;
    url: string;
}

export interface GitAnalysisResult {
    commits: CommitInfo[];
    pullRequests: PullRequestInfo[];
    timeline: TimelineItem[];
}

export interface TimelineItem {
    type: 'commit' | 'pullRequest';
    date: string;
    data: CommitInfo | PullRequestInfo;
}

export interface CodexResults {
    summary: string;
    analysisResult: GitAnalysisResult;
    selectedText: string;
    filePath: string;
    lineRange: string;
}