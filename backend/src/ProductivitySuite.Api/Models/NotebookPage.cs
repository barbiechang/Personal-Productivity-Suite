namespace ProductivitySuite.Api.Models;

public enum PaperStyle
{
    Blank,
    Lined,
    Grid
}

public class NotebookPage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public PaperStyle PaperStyle { get; set; } = PaperStyle.Blank;

    // Serialized Fabric.js canvas JSON (strokes, background image, etc.)
    public string CanvasJson { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
