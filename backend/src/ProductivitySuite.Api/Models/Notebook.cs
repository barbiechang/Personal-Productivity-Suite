namespace ProductivitySuite.Api.Models;

public class Notebook
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = "Untitled";
    public string? CoverDataUrl { get; set; }
    public bool CoverIsCustom { get; set; }
    public Guid? FolderId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<NotebookPage> Pages { get; set; } = [];
}
