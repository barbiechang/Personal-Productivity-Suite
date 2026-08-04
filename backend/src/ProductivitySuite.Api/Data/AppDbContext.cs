using Microsoft.EntityFrameworkCore;
using ProductivitySuite.Api.Models;

namespace ProductivitySuite.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<TodoItem> Todos => Set<TodoItem>();
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<NotebookPage> NotebookPages => Set<NotebookPage>();
    public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<FileItem> Files => Set<FileItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Expense>().Property(e => e.Amount).HasPrecision(12, 2);
    }
}
