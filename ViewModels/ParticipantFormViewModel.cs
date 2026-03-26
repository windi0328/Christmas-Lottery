using System.ComponentModel.DataAnnotations;

namespace ChristmasGiftExchange.ViewModels;

public class ParticipantFormViewModel
{
    [Required, StringLength(40)]
    [Display(Name = "姓名")]
    public string Name { get; set; } = string.Empty;

    [EmailAddress, StringLength(120)]
    [Display(Name = "Email（選填）")]
    public string? Email { get; set; }

    [StringLength(160)]
    [Display(Name = "小提示（選填）")]
    public string? WishlistHint { get; set; }
}
