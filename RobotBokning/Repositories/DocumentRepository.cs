
using RobotBokning.Data;
using RobotBokning.Models;


namespace RobotBokning.Repositories
{
    public interface IDocumentRepository
    {
        Task<Document> GetByIdAsync(int id);
        Task<Document> AddAsync(Document document);
        Task DeleteAsync(Document document);
    }

    public class DocumentRepository : IDocumentRepository
    {
        private readonly ApplicationDbContext _context;

        public DocumentRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Document> GetByIdAsync(int id)
        {
            return await _context.Documents.FindAsync(id);
        }

        public async Task<Document> AddAsync(Document document)
        {
            _context.Documents.Add(document);
            await _context.SaveChangesAsync();
            return document;
        }

        public async Task DeleteAsync(Document document)
        {
            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();
        }
    }
}
