interface GitHubLinkProps {
    repoUrl: string;
  }
  
  const GitHubLink: React.FC<GitHubLinkProps> = ({ repoUrl }) => {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '5px 10px',
          borderRadius: '5px',
          color: 'white',
          fontSize: '12px',
          zIndex: 10,
        }}
      >
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'white',
            textDecoration: 'none',
          }}
        >
          Go to Git Repo
        </a>
      </div>
    );
  };

    export default GitHubLink;