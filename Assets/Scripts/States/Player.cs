// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 1.0.31
// 

using Colyseus.Schema;

public partial class Player : Schema {
	[Type(0, "string")]
	public string userId = default(string);

	[Type(1, "number")]
	public float position = default(float);

	[Type(2, "number")]
	public float score = default(float);

	[Type(3, "number")]
	public float canSkip = default(float);

	[Type(4, "array", typeof(ArraySchema<float>), "number")]
	public ArraySchema<float> totalMoves = new ArraySchema<float>();

	[Type(5, "array", typeof(ArraySchema<float>), "number")]
	public ArraySchema<float> usedMoves = new ArraySchema<float>();
}

