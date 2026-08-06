using System.Text.Json.Serialization;

namespace ProductivitySuite.Api.Models;

public enum PaperStyle
{
    Blank,
    Lined,
    Grid,
    DotGrid
}

public enum PageSize
{
    A4,
    Letter,
    Fullscreen
}

public class NotebookPage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid NotebookId { get; set; }

    [JsonIgnore]
    public Notebook? Notebook { get; set; }

    public string Title { get; set; } = string.Empty;
    public int Order { get; set; }
    public PaperStyle PaperStyle { get; set; } = PaperStyle.Blank;
    public PageSize PageSize { get; set; } = PageSize.A4;
    public string BackgroundColor { get; set; } = "#ffffff";

    // Serialized Fabric.js canvas JSON (strokes, shapes, text, images, background image, etc.)
    public string CanvasJson { get; set; } = string.Empty;
    public string? ThumbnailDataUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
