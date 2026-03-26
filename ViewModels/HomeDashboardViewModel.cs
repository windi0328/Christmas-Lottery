namespace ChristmasGiftExchange.ViewModels;

public class HomeDashboardViewModel
{
    public int TotalEvents { get; set; }
    public int TotalParticipants { get; set; }
    public int TotalDraws { get; set; }
    public IReadOnlyList<HomeEventCardViewModel> UpcomingEvents { get; set; } = [];
}

public class HomeEventCardViewModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime EventDate { get; set; }
    public string Location { get; set; } = string.Empty;
    public int ParticipantCount { get; set; }
    public bool HasDrawn { get; set; }
}
