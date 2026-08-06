namespace ProductivitySuite.Api.Models;

public class TodoProjectResource
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string? FileDataUrl { get; set; }
    public string? FileName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
