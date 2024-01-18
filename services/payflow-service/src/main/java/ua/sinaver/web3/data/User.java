package ua.sinaver.web3.data;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Date;
import java.util.List;

// TODO: add indexes (for query search)
@ToString(exclude = "invitationAllowance")
@Setter
@Getter
@NoArgsConstructor
@Entity
@Table(uniqueConstraints = {
		@UniqueConstraint(name = "uc_user_identity", columnNames = {"identity"}),
		@UniqueConstraint(name = "uc_user_signer", columnNames = {"signer"}),
		@UniqueConstraint(name = "uc_user_username", columnNames = {"username"}),
		@UniqueConstraint(name = "uc_user_display_name", columnNames = {"display_name"})})
public class User {
	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private Integer id;

	@Column(name = "display_name")
	private String displayName;

	@Column
	private String username;

	@Column
	private String profileImage;

	@Column(columnDefinition = "boolean")
	private boolean locked = false;

	@Column(columnDefinition = "boolean")
	private boolean allowed = false;

	@Column(nullable = false)
	private String identity;

	@Column
	private String signer;

	@OneToOne(cascade = CascadeType.ALL)
	@JoinColumn(name = "flow_id", referencedColumnName = "id")
	private Flow defaultFlow;

	@OneToMany(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
	@JoinColumn(name = "user_id", referencedColumnName = "id")
	private List<Flow> flows;

	@OneToOne(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
	private InvitationAllowance invitationAllowance;

	@Column
	@Temporal(TemporalType.TIMESTAMP)
	private Date createdDate = new Date();

	@Column
	@Temporal(TemporalType.TIMESTAMP)
	private Date lastSeen = new Date();

	@Version
	private Long version;

	public User(String identity) {
		this.identity = identity;
	}
}
