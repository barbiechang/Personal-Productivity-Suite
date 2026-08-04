namespace ProductivitySuite.Api.Models;

public class FileItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string ContentType { get; set; } = "application/octet-stream";
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
