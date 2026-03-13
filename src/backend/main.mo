import Text "mo:core/Text";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";

actor {
  public type PostId = Nat;
  public type CommentId = Nat;
  public type CategoryId = Nat;
  public type IpHash = Text;

  public type Post = {
    id : PostId;
    title : Text;
    content : Text;
    category : ?CategoryId;
    timestamp : Int;
    upvotes : Nat;
    commentCount : Nat;
    ipHash : IpHash;
    isHidden : Bool;
  };

  public type Comment = {
    id : CommentId;
    postId : PostId;
    content : Text;
    timestamp : Int;
    upvotes : Nat;
    ipHash : IpHash;
    isHidden : Bool;
  };

  public type Category = {
    id : CategoryId;
    name : Text;
    isActive : Bool;
  };

  public type CreatePostError = {
    #bannedIp;
    #rateLimitExceeded;
    #contentBlocked;
    #internalError;
  };

  public type CreateCommentError = {
    #bannedIp;
    #contentBlocked;
    #internalError;
  };

  public type UpvoteResult = {
    newCount : Nat;
    alreadyVoted : Bool;
  };

  public type PostTab = {
    #trending;
    #latest;
  };

  public type PostWithComments = {
    post : Post;
    comments : [Comment];
  };

  public type PostsPage = {
    posts : [Post];
    totalCount : Nat;
  };

  public type Stats = {
    totalPosts : Nat;
    totalComments : Nat;
    dailyPostCounts : [Nat];
  };

  var nextPostId = 1;
  var nextCommentId = 1;
  var nextCategoryId = 7; // Start after seeded defaults

  let posts = Map.empty<PostId, Post>();
  let comments = Map.empty<CommentId, Comment>();
  let categories = Map.empty<CategoryId, Category>();
  let bannedIps = Set.empty<IpHash>();
  let blockedKeywords = Set.empty<Text>();

  let postUpvotes = Map.empty<PostId, Set.Set<IpHash>>();
  let commentUpvotes = Map.empty<CommentId, Set.Set<IpHash>>();

  // Kept for upgrade compatibility with previous version (rate limiting removed)
  let postTimestamps = Map.empty<IpHash, [Int]>();

  // Kept for upgrade compatibility with previous version (now seeded below)
  let initialCategories : [({ #categoryId : Nat }, Text)] = [];

  // Seed default categories if none exist yet
  do {
    if (categories.size() == 0) {
      let defaults : [(CategoryId, Text)] = [
        (1, "Career"),
        (2, "Workplace"),
        (3, "Startup"),
        (4, "Manufacturing"),
        (5, "Confessions"),
        (6, "Advice"),
      ];
      for ((id, name) in defaults.vals()) {
        categories.add(id, { id; name; isActive = true });
      };
    };
  };

  let dayInNanos : Int = 86_400_000_000_000;

  // Compute trending score: upvotes * 2 + commentCount * 3 + recency bonus
  func trendingScore(p : Post) : Int {
    let ageHours = (Time.now() - p.timestamp) / (dayInNanos / 24);
    let recency = if (ageHours < 1) 100 else if (ageHours < 6) 50 else if (ageHours < 24) 20 else if (ageHours < 48) 5 else 0;
    p.upvotes.toInt() * 2 + p.commentCount.toInt() * 3 + recency;
  };

  public shared func createPost(title : Text, content : Text, category : ?CategoryId, ipHash : IpHash) : async {
    #ok : Post;
    #err : CreatePostError;
  } {
    if (not isValid(title) or not isValid(content)) { return #err(#internalError) };
    if (bannedIps.contains(ipHash)) { return #err(#bannedIp) };

    // Resolve category: if provided but not found or inactive, ignore it gracefully
    let resolvedCategory : ?CategoryId = switch (category) {
      case (?catId) {
        switch (categories.get(catId)) {
          case (?cat) { if (cat.isActive) ?catId else null };
          case (null) { null };
        };
      };
      case (null) { null };
    };

    let post : Post = {
      id = nextPostId;
      title;
      content;
      category = resolvedCategory;
      timestamp = Time.now();
      upvotes = 0;
      commentCount = 0;
      ipHash;
      isHidden = false;
    };

    posts.add(nextPostId, post);
    nextPostId += 1;
    #ok(post);
  };

  public shared func createComment(postId : PostId, content : Text, ipHash : IpHash) : async {
    #ok : Comment;
    #err : CreateCommentError;
  } {
    if (not isValid(content)) { return #err(#contentBlocked) };
    if (bannedIps.contains(ipHash)) { return #err(#bannedIp) };
    switch (posts.get(postId)) {
      case (null) { return #err(#internalError) };
      case (?post) {
        let comment : Comment = {
          id = nextCommentId;
          postId;
          content;
          timestamp = Time.now();
          upvotes = 0;
          ipHash;
          isHidden = false;
        };
        comments.add(nextCommentId, comment);
        nextCommentId += 1;

        let updatedPost = { post with commentCount = post.commentCount + 1 };
        posts.add(postId, updatedPost);
        #ok(comment);
      };
    };
  };

  public shared func upvotePost(postId : PostId, ipHash : IpHash) : async ?UpvoteResult {
    switch (posts.get(postId)) {
      case (null) { null };
      case (?post) {
        let currentVoters = postUpvotes.get(postId);
        switch (currentVoters) {
          case (?voters) {
            if (voters.contains(ipHash)) {
              ?{ newCount = post.upvotes; alreadyVoted = true };
            } else {
              voters.add(ipHash);
              let updatedPost = { post with upvotes = post.upvotes + 1 };
              posts.add(postId, updatedPost);
              ?{ newCount = updatedPost.upvotes; alreadyVoted = false };
            };
          };
          case (null) {
            let newVoters = Set.empty<IpHash>();
            newVoters.add(ipHash);
            postUpvotes.add(postId, newVoters);
            let updatedPost = { post with upvotes = post.upvotes + 1 };
            posts.add(postId, updatedPost);
            ?{ newCount = updatedPost.upvotes; alreadyVoted = false };
          };
        };
      };
    };
  };

  public shared func upvoteComment(commentId : CommentId, ipHash : IpHash) : async ?UpvoteResult {
    switch (comments.get(commentId)) {
      case (null) { null };
      case (?comment) {
        let currentVoters = commentUpvotes.get(commentId);
        switch (currentVoters) {
          case (?voters) {
            if (voters.contains(ipHash)) {
              ?{ newCount = comment.upvotes; alreadyVoted = true };
            } else {
              voters.add(ipHash);
              let updatedComment = { comment with upvotes = comment.upvotes + 1 };
              comments.add(commentId, updatedComment);
              ?{ newCount = updatedComment.upvotes; alreadyVoted = false };
            };
          };
          case (null) {
            let newVoters = Set.empty<IpHash>();
            newVoters.add(ipHash);
            commentUpvotes.add(commentId, newVoters);
            let updatedComment = { comment with upvotes = comment.upvotes + 1 };
            comments.add(commentId, updatedComment);
            ?{ newCount = updatedComment.upvotes; alreadyVoted = false };
          };
        };
      };
    };
  };

  public query func getPosts(tab : PostTab, category : ?CategoryId, page : Nat, pageSize : Nat) : async PostsPage {
    let allPostsArr = posts.values().toArray();

    let filtered = allPostsArr.filter(
      func(p : Post) : Bool {
        if (p.isHidden) return false;
        switch (category, p.category) {
          case (null, _) { true };
          case (?catId, ?postCatId) { catId == postCatId };
          case (_, _) { false };
        };
      }
    );

    let sorted = switch (tab) {
      case (#trending) {
        filtered.sort(func(a : Post, b : Post) : { #less; #equal; #greater } {
          let sa = trendingScore(a);
          let sb = trendingScore(b);
          if (sa > sb) #less else if (sa < sb) #greater else #equal;
        });
      };
      case (#latest) {
        filtered.sort(func(a : Post, b : Post) : { #less; #equal; #greater } {
          if (a.timestamp > b.timestamp) #less else if (a.timestamp < b.timestamp) #greater else #equal;
        });
      };
    };

    let totalCount = sorted.size();
    let startIdx = page * pageSize;
    if (startIdx >= totalCount) {
      return { posts = []; totalCount };
    };
    let endIdx = Int.min((startIdx + pageSize).toInt(), totalCount.toInt()).toNat();
    {
      posts = sorted.sliceToArray(startIdx, endIdx);
      totalCount;
    };
  };

  public query func getPost(id : PostId) : async PostWithComments {
    switch (posts.get(id)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) {
        let postComments = comments.values().filter(func(c : Comment) : Bool { c.postId == id and not c.isHidden });
        { post; comments = postComments.toArray() };
      };
    };
  };

  public query func getComments(postId : PostId) : async [Comment] {
    let filteredComments = comments.values().filter(func(c : Comment) : Bool { c.postId == postId and not c.isHidden });
    filteredComments.toArray();
  };

  public query func getAnonymousId(ipHash : IpHash, postId : PostId) : async Nat {
    let hashValue = ipHash.size() + postId;
    (hashValue % 9000) + 1000;
  };

  public query func getStats() : async Stats {
    {
      totalPosts = posts.size();
      totalComments = comments.size();
      dailyPostCounts = [0, 0, 0, 0, 0, 0, 0];
    };
  };

  public shared func adminDeletePost(id : PostId, adminPassword : Text) : async Bool {
    if (adminPassword != "whisper2024") { return false };
    posts.remove(id);
    true;
  };

  public shared func adminDeleteComment(id : CommentId, adminPassword : Text) : async Bool {
    if (adminPassword != "whisper2024") { return false };
    comments.remove(id);
    true;
  };

  public shared func adminBanIp(ipHash : IpHash, adminPassword : Text) : async Bool {
    if (adminPassword != "whisper2024") { return false };
    bannedIps.add(ipHash);
    true;
  };

  public shared func adminUnbanIp(ipHash : IpHash, adminPassword : Text) : async Bool {
    if (adminPassword != "whisper2024") { return false };
    bannedIps.remove(ipHash);
    true;
  };

  public shared func adminAddBlockedKeyword(keyword : Text, adminPassword : Text) : async Bool {
    if (adminPassword != "whisper2024") { return false };
    blockedKeywords.add(keyword);
    true;
  };

  public shared func adminRemoveBlockedKeyword(keyword : Text, adminPassword : Text) : async Bool {
    if (adminPassword != "whisper2024") { return false };
    blockedKeywords.remove(keyword);
    true;
  };

  public shared func adminAddCategory(name : Text, adminPassword : Text) : async Bool {
    if (adminPassword != "whisper2024") { return false };
    categories.add(nextCategoryId, { id = nextCategoryId; name; isActive = true });
    nextCategoryId += 1;
    true;
  };

  public shared func adminRemoveCategory(id : CategoryId, adminPassword : Text) : async Bool {
    if (adminPassword != "whisper2024") { return false };
    categories.remove(id);
    true;
  };

  public query func adminGetBannedIps(adminPassword : Text) : async ?[IpHash] {
    if (adminPassword != "whisper2024") { return null };
    ?bannedIps.toArray();
  };

  public query func adminGetBlockedKeywords(adminPassword : Text) : async ?[Text] {
    if (adminPassword != "whisper2024") { return null };
    ?blockedKeywords.toArray();
  };

  public query func adminGetCategories(adminPassword : Text) : async ?[Category] {
    if (adminPassword != "whisper2024") { return null };
    ?categories.values().toArray();
  };

  public query func getCategories() : async [Category] {
    categories.values().filter(func(c : Category) : Bool { c.isActive }).toArray();
  };

  func isValid(text : Text) : Bool {
    text.size() > 0;
  };

  // Suppress unused variable warnings for compatibility fields
  func _unusedCompat() {
    let _ = postTimestamps.size();
    let _ = initialCategories.size();
  };
};
