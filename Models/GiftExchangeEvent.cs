using System.ComponentModel.DataAnnotations;

namespace ChristmasGiftExchange.Models;

public class GiftExchangeEvent
{
    public int Id { get; set; }

    [Required, StringLength(80)]
    public string Name { get; set; } = string.Empty;

    [Required, StringLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime EventDate { get; set; }

    [Required, StringLength(120)]
    public string Location { get; set; } = string.Empty;

    [Required]
    public DateTime RegistrationDeadline { get; set; }

    [Range(1, 50000)]
    public decimal Budget { get; set; }

    public ICollection<Participant> Participants { get; set; } = new List<Participant>();
    public ICollection<DrawAssignment> Assignments { get; set; } = new List<DrawAssignment>();
}
